import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './api';
import TopNav from './TopNav';

export default function CreateHousehold({ user, onHouseholdCreated, onSignOut }) {
  const navigate = useNavigate();
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Create Household</h1>
          <p className="text-sm text-gray-500 mt-1">Let's set up your household</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
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
            className="w-full bg-[#39FF14] text-gray-900 font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Household'}
          </button>
        </form>
      </main>
    </div>
  );
}
