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
  const [plan, setPlan] = useState('free');
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
          notes: notes || null,
          plan: plan || 'free'
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
      <main className="flex justify-center py-16">
        <div className="max-w-6xl px-6 w-full">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Create Household</h1>
          <p className="text-sm text-gray-500 mt-1">Let's set up your household</p>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose a plan</label>
            <div className="flex items-center gap-3">
              <label className={`inline-flex items-center gap-3 p-3 rounded-lg border ${plan==='free' ? 'border-accent bg-accent/10' : 'border-gray-200'} cursor-pointer`}>
                <input type="radio" name="plan" value="free" checked={plan==='free'} onChange={() => setPlan('free')} className="hidden" />
                <div className="text-sm font-semibold">Free</div>
                <div className="text-xs text-gray-500">Basic features</div>
              </label>
              <label className="inline-flex items-center gap-3 p-3 rounded-lg border border-gray-200 opacity-50 cursor-not-allowed">
                <input type="radio" name="plan" value="premium" disabled className="hidden" />
                <div className="text-sm font-semibold">Premium</div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </label>
              <label className="inline-flex items-center gap-3 p-3 rounded-lg border border-gray-200 opacity-50 cursor-not-allowed">
                <input type="radio" name="plan" value="business" disabled className="hidden" />
                <div className="text-sm font-semibold">Business</div>
                <div className="text-xs text-gray-500">Coming soon</div>
              </label>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {!user && (
            <div className="space-y-4 border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-gray-600 mb-0">Create an account to manage your household</p>
                <span className="info-icon-inline text-accent group" tabIndex="0" aria-label="More info" style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, background: 'none', border: 'none', borderRadius: 0, padding: 0, cursor: 'pointer', position: 'relative', verticalAlign: 'middle' }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', verticalAlign: 'middle' }}>
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M10 7.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm.75 2.25c0-.41-.34-.75-.75-.75s-.75.34-.75.75v3c0 .41.34.75.75.75s.75-.34.75-.75v-3z" fill="currentColor"/>
                  </svg>
                  <div className="absolute left-1/2 z-50 -translate-x-1/2 mt-2 w-80 p-4 rounded-xl shadow-lg bg-white text-gray-400 text-sm border border-gray-200 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus:pointer-events-auto transition-opacity duration-200" style={{ minWidth: '260px', fontWeight: 400, textTransform: 'none' }}>
                    You will be the main member of the household you create. You can invite more members to your household at any time. These may be other family members, pet sitters, dog walkers, work colleagues, etc. You can set different privileges to each member depending on their role.
                  </div>
                </span>
              </div>
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

          <div className="flex">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-accent text-white font-semibold py-2 px-4 rounded-xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true" focusable="false">
                    <path fill="white" d="M12 3l9 8h-3v8h-12v-8h-3l9-8z" />
                  </svg>
                  <span>Create Household</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      </main>
    </div>
  );
}
