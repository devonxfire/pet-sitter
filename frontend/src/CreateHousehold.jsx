import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './api';
import TopNav from './TopNav';

export default function CreateHousehold({ user, onHouseholdCreated, onSignOut, onSignup }) {
  const navigate = useNavigate();
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [numberOfMembers, setNumberOfMembers] = useState('1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // If there's no authenticated user, first sign the user up
      if (!user) {
        if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
          setError('Name, email and password are required to create an account');
          setLoading(false);
          return;
        }

        try {
          const signupData = await apiFetch('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name: signupName.trim(), email: signupEmail.trim(), password: signupPassword })
          });
          // Persist token and user in localStorage so subsequent apiFetch calls include the token
          if (signupData.token) {
            localStorage.setItem('token', signupData.token);
          }
          if (signupData.user) {
            localStorage.setItem('user', JSON.stringify(signupData.user));
          }

          // Inform parent app about login/signup so it can update state
          if (onSignup) {
            try {
              onSignup(signupData.user, signupData.token);
            } catch (e) {
              console.warn('onSignup callback failed', e);
            }
          }
        } catch (err) {
          console.error('Signup error:', err);
          setError(err.message || 'Failed to create account');
          setLoading(false);
          return;
        }
      }

      if (!householdName.trim()) {
        setError('Household name is required');
        setLoading(false);
        return;
      }

      console.log('📤 Creating household:', { householdName, address, city, state, zipCode, country, numberOfMembers, notes });
      
      const data = await apiFetch('/api/households', {
        method: 'POST',
        body: JSON.stringify({
          name: householdName.trim(),
          address: address || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          country: country || null,
          numberOfMembers: numberOfMembers ? parseInt(numberOfMembers) : null,
          notes: notes || null
        })
      });

      console.log('✅ Household created:', data);
      onHouseholdCreated(data);
      navigate('/add-pet', { state: { household: data } });
    } catch (err) {
      console.error('❌ Error creating household:', err);
      setError(err.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNav user={user} household={null} onSignOut={onSignOut} />

      <main className="flex justify-center py-16">
        <div className="max-w-6xl px-6 w-full">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Create Household</h1>
          <p className="text-sm text-gray-500 mt-1">Let's set up your household</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {!user && (
            <div className="space-y-4 border-b border-gray-100 pb-4 mb-4">
              <p className="text-sm text-gray-600">Create an account to manage your household</p>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Full name *</label>
                <input value={signupName} onChange={(e) => setSignupName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email *</label>
                <input value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Password *</label>
                <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none" placeholder="Choose a strong password" />
              </div>
            </div>
          )}

          {/* Household Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Household Name *
            </label>
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g., Martindale Family"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Address (optional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
            />
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                City (optional)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                State (optional)
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State/Province"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Zip Code (optional)
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Zip code"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Country (optional)
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Number of Members */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Number of Household Members (optional)
            </label>
            <input
              type="number"
              value={numberOfMembers}
              onChange={(e) => setNumberOfMembers(e.target.value)}
              min="1"
              max="20"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can invite household members later
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional info about your household..."
              rows="3"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                <span aria-hidden="true" className="mr-2">🏠</span>
                <span>Create Household</span>
              </>
            )}
          </button>
        </form>
      </div>
      </main>
    </div>
  );
}
