import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch, API_BASE } from './api';
import TopNav from './TopNav';

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

  return (
    <div className="min-h-screen bg-white">
      <TopNav user={user} household={household} onSignOut={onSignOut} />

      <main className="flex justify-center py-16">
        <div className="max-w-6xl px-6 w-full">
        {/* Welcome Message */}
        {household?.name && (
          <div className="text-center my-8">
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
              className="bg-[#20B2AA] text-gray-900 font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition"
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
                  className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition cursor-pointer h-96 flex flex-col items-center justify-center text-center"
                >
                  {/* Circular Photo */}
                  <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-gray-300 mb-6 flex items-center justify-center overflow-hidden">
                    {pet.photoUrl ? (
                      <img
                        src={resolvePhotoUrl(pet.photoUrl)}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">📷</div>
                    )}
                  </div>

                  {/* Pet Name */}
                  <h2 className="text-5xl font-bold text-gray-900 mb-4">{pet.name}</h2>

                  {/* Pet Details */}
                  <p className="text-lg text-gray-600 mb-2">
                    {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
                    {pet.breed && ` • ${pet.breed}`}
                  </p>
                  {pet.age && <p className="text-sm text-gray-500">Age: {pet.age} years</p>}
                  {pet.weight && <p className="text-sm text-gray-500">Weight: {pet.weight} lbs</p>}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-20 mb-8">
              <button
                onClick={() => navigate('/add-pet', { state: { household } })}
                className="bg-[#20B2AA] text-white text-2xl font-bold px-12 py-4 hover:opacity-90 transition shadow-lg w-auto min-w-[240px] h-auto rounded-none"
                style={{ letterSpacing: '0.03em' }}
              >
                + Add Pet
              </button>
            </div>
            {/* Divider */}
            <div style={{ margin: '48px 0', borderBottom: '1px solid #E5E7EB' }}></div>

            {/* Household Info Section - After Pets */}
            {household && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">Household</h2>
                <div className="space-y-4 text-lg text-gray-700">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="text-xl font-medium text-gray-900">{household.name}</p>
                  </div>
                  {household.owner_email && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Owner</p>
                      <p className="text-xl font-medium text-gray-900">{household.owner_email}</p>
                    </div>
                  )}
                  {household.mainMemberName && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Main Member</p>
                      <p className="text-base text-gray-900">{household.mainMemberName}</p>
                    </div>
                  )}
                  {household.members && household.members.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Members ({household.members.length})</p>
                      <ul className="space-y-4">
                        {household.members.map((member) => (
                          <li key={member.id} className="border-b pb-2">
                            <span className="block text-lg font-semibold text-gray-900">{member.name || member.email}</span>
                            <span className="block text-sm text-gray-600">{member.email}</span>
                            <span className="block text-sm text-gray-500">Role: {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : ''}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  
                 
              
                 
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
