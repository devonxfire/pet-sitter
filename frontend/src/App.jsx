import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { apiFetch } from './api';
import Login from './Login';
import Dashboard from './Dashboard';
import Profile from './Profile';
import CreateHousehold from './CreateHousehold';
import Landing from './Landing';
import AddPet from './AddPet';
import PetDetail from './PetDetail';
import PetActivities from './PetActivities';
import EditPet from './EditPet';
import HouseholdSettings from './HouseholdSettings';
import Footer from './Footer';
import Terms from './Terms';
import Privacy from './Privacy';
import Contact from './Contact';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useState(null);
  const [householdsLoading, setHouseholdsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check for household in router state
    if (location.state?.household && !household) {
      setHousehold(location.state.household);
    }
  }, [location.state?.household, household]);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch households for logged-in user if not already loaded
    const token = localStorage.getItem('token');
    if (!user || !token || household) return;

    const loadHouseholds = async () => {
      setHouseholdsLoading(true);
      try {
        const data = await apiFetch('/api/households');
        if (Array.isArray(data) && data.length > 0) {
          setHousehold(data[0]);
        }
      } catch (err) {
        console.error('Failed to load households:', err);
      } finally {
        setHouseholdsLoading(false);
      }
    };

    loadHouseholds();
  }, [user, household]);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleHouseholdCreated = (householdData) => {
    setHousehold(householdData);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setHousehold(null);
    setHouseholdsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="grow">
        <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/create-household"
          element={
            user ? (
              user.isMainMember ? (
                <CreateHousehold
                  user={user}
                  onHouseholdCreated={handleHouseholdCreated}
                  onSignOut={handleSignOut}
                />
              ) : (
                <Navigate to="/dashboard" />
              )
            ) : (
              <CreateHousehold
                user={null}
                onHouseholdCreated={handleHouseholdCreated}
                onSignOut={handleSignOut}
                onSignup={handleLogin}
              />
            )
          }
        />
        <Route
          path="/add-pet"
          element={
            user ? (
              <AddPet user={user} household={household} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/pet/:petId"
          element={
            user ? (
              <PetDetail household={household} user={user} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/pet/:petId/activities"
          element={
            user ? (
              <PetActivities household={household} user={user} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/pet/:petId/edit"
          element={
            user ? (
              <EditPet user={user} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/household-settings"
          element={
            user ? (
              <HouseholdSettings household={household} user={user} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <Profile user={user} household={household} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/" element={<Landing user={user} onSignOut={handleSignOut} />} />

        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/contact" element={<Contact />} />

        <Route
          path="/dashboard"
          element={
            user ? (
              user.isMainMember && !household ? (
                householdsLoading ? (
                  <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="text-xl text-gray-400">Loading household...</div>
                  </div>
                ) : (
                <Navigate to="/create-household" />
                )
              ) : (
                <Dashboard user={user} household={household} onSignOut={handleSignOut} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        </Routes>
      </div>
      <Footer user={user} />
    </div>
  );
}

export default App;
