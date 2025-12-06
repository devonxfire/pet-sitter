import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { apiFetch } from './api';
import Login from './Login';
import Dashboard from './Dashboard';
import CreateHousehold from './CreateHousehold';
import AddPet from './AddPet';
import PetDetail from './PetDetail';
import EditPet from './EditPet';
import HouseholdSettings from './HouseholdSettings';

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
    <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/create-household"
          element={
            user && user.isMainMember ? (
              <CreateHousehold
                user={user}
                onHouseholdCreated={handleHouseholdCreated}
                onSignOut={handleSignOut}
              />
            ) : user ? (
              <Navigate to="/" />
            ) : (
              <Navigate to="/login" />
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
          path="/"
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
  );
}

export default App;
