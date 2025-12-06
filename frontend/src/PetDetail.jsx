import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from './api';
import TopNav from './TopNav';

export default function PetDetail({ household, user, onSignOut }) {
  const navigate = useNavigate();
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPetDetails = async () => {
      try {
        const petData = await apiFetch(`/api/pets/${petId}`);
        setPet(petData);

        const activitiesData = await apiFetch(`/api/pets/${petId}/activities`);
        setActivities(activitiesData);
      } catch (err) {
        setError(err.message || 'Failed to load pet details');
        console.error('Error fetching pet details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (petId) {
      fetchPetDetails();
    }
  }, [petId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Pet not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav user={user} household={household} onSignOut={onSignOut} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/pet/${petId}/edit`)}
              className="bg-gray-200 text-gray-900 font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
            >
              Edit
            </button>
            <button
              onClick={() => navigate('/', { state: { logActivityFor: petId } })}
              className="bg-[#39FF14] text-gray-900 font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
            >
              Log Activity
            </button>
          </div>
        </div>
        {/* Pet Header */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{pet.name}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Species</p>
              <p className="text-lg font-semibold text-gray-900">{pet.species}</p>
            </div>
            {pet.breed && (
              <div>
                <p className="text-sm text-gray-500">Breed</p>
                <p className="text-lg font-semibold text-gray-900">{pet.breed}</p>
              </div>
            )}
            {pet.age && (
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="text-lg font-semibold text-gray-900">{pet.age} years</p>
              </div>
            )}
            {pet.weight && (
              <div>
                <p className="text-sm text-gray-500">Weight</p>
                <p className="text-lg font-semibold text-gray-900">{pet.weight} lbs</p>
              </div>
            )}
          </div>
          {pet.notes && (
            <div className="mt-6">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-gray-700">{pet.notes}</p>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Timeline</h2>
          {activities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No activities logged yet</p>
              <button
                onClick={() => navigate('/', { state: { logActivityFor: petId } })}
                className="mt-4 bg-[#39FF14] text-gray-900 font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
              >
                Log First Activity
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-900">
                      {activity.activityType?.name || 'Activity'}
                    </p>
                    <time className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </time>
                  </div>
                  {activity.notes && (
                    <p className="text-gray-700 text-sm">{activity.notes}</p>
                  )}
                  {activity.user && (
                    <p className="text-xs text-gray-500 mt-2">by {activity.user.name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
