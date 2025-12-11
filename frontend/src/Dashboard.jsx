import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch, API_BASE } from './api';
import TopNav from './TopNav';
import { getFallbackFlower, assignHouseholdFlowers, FLOWER_LIST } from './flowerIcon';
import FlowerIcon from './FlowerIcon.jsx';

export default function Dashboard({ user, household, onSignOut }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  const resolvePhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };


  useEffect(() => {
    const fetchPets = async () => {
      if (!household?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiFetch(`/api/households/${household.id}/pets`);
        setPets(data);
      } catch (err) {
        console.error('Failed to fetch pets:', err);
      } finally {
        setLoading(false);
      }
    };

    console.log('Dashboard household:', household); // Debug log
    fetchPets();
  }, [household?.id, location.state?.petAdded]);

  // Pre-compute household flower mapping so JSX is simpler and deterministic
  const mapping = assignHouseholdFlowers(pets || []);

  return (
    <div className="min-h-screen bg-white">
      <TopNav user={user} household={household} onSignOut={onSignOut} />

      <main className="flex justify-center py-12">
        <div className="max-w-6xl px-6 w-full">
        {/* Welcome Message */}
        {household?.name && (
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900">
              Welcome, {household.name}!
            </h1>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">Welcome! Let's set up your first pet.</p>
            <button
              onClick={() => navigate('/add-pet', { state: { household } })}
              className="bg-accent text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition"
            >
              Add Your First Pet
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Your Pets</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  onClick={() => navigate(`/pet/${pet.id}`)}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-200 transition-transform duration-300 ease-in-out transform-gpu hover:scale-105 hover:shadow-xl cursor-pointer flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4"
                >
                  {/* Rounded-square Photo */}
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gray-200 border-2 border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                    {pet.photoUrl ? (
                      <img
                        src={resolvePhotoUrl(pet.photoUrl)}
                        alt={pet.name}
                        className="w-full h-full object-cover select-none"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                    )}
                  </div>

                  {/* Text content next to avatar (match avatar height) */}
                  <div className="flex-1 h-28 md:h-32 flex flex-col justify-between">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {pet.name} <span className="ml-2 inline-block align-middle" aria-hidden>
                          <FlowerIcon variant={FLOWER_LIST.indexOf(mapping[String(pet.id)])} seed={String(pet.id || pet.name || '')} size={18} className="inline-block" />
                        </span>
                      </h2>
                      <p className="text-sm md:text-base text-gray-600 mt-1">
                        {(pet.species || '').charAt(0).toUpperCase() + (pet.species || '').slice(1)}{pet.breed ? ` • ${pet.breed}` : ''}
                      </p>
                    </div>

                    <div className="text-sm text-gray-500 space-y-1">
                      {pet.age && <div>Age: {pet.age} years</div>}
                      {pet.weight && <div>Weight: {pet.weight} {pet.weightUnit || 'lbs'}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-start mt-12 mb-8">
              <button
                onClick={() => navigate('/add-pet', { state: { household } })}
                className="bg-accent text-white text-lg font-semibold px-5 py-2 hover:opacity-90 transition shadow rounded-lg"
                style={{ letterSpacing: '0.02em' }}
              >
                + Add Pet
              </button>
            </div>
            {/* Household section removed */}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}