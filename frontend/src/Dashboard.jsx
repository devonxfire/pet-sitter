import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from './api';
import TopNav from './TopNav';

export default function Dashboard({ user, household, onSignOut }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

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

    fetchPets();
  }, [household?.id, location.state?.petAdded]);

  return (
    <div className="min-h-screen bg-white">
      <TopNav user={user} household={household} onSignOut={onSignOut} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-8">Welcome! Let's set up your first pet.</p>
            <button
              onClick={() => navigate('/add-pet', { state: { household } })}
              className="bg-[#39FF14] text-gray-900 font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition"
            >
              Add Your First Pet
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Your Pets</h2>
              <button
                onClick={() => navigate('/add-pet', { state: { household } })}
                className="bg-[#39FF14] text-gray-900 font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
              >
                + Add Pet
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div key={pet.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{pet.name}</h2>
                  <p className="text-sm text-gray-600">
                    {pet.species}
                    {pet.breed && ` • ${pet.breed}`}
                  </p>
                  {pet.age && <p className="text-sm text-gray-500">Age: {pet.age} years</p>}
                  {pet.weight && <p className="text-sm text-gray-500">Weight: {pet.weight} lbs</p>}
                  <button
                    onClick={() => navigate(`/pet/${pet.id}`)}
                    className="mt-4 w-full bg-[#39FF14] text-gray-900 font-semibold py-2 rounded-lg hover:opacity-90 transition"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
