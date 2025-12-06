import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from './api';
import TopNav from './TopNav';
import LogActivity from './LogActivity';

export default function PetDetail({ household, user, onSignOut }) {
  const navigate = useNavigate();
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'past', 'upcoming'
  const [editingSection, setEditingSection] = useState(null); // 'general', 'vet', 'food'
  const [editValues, setEditValues] = useState({});
  const [savingSection, setSavingSection] = useState(false);

  // Filter activities based on selected filter
  const filteredActivities = activities.filter(activity => {
    const activityTime = new Date(activity.timestamp);
    const now = new Date();
    if (activityFilter === 'past') return activityTime <= now;
    if (activityFilter === 'upcoming') return activityTime > now;
    return true; // 'all'
  });

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

  const startEditingSection = (section) => {
    setEditingSection(section);
    if (section === 'general') {
      setEditValues({
        species: pet.species,
        breed: pet.breed || '',
        age: pet.age?.toString() || '',
        weight: pet.weight?.toString() || '',
        notes: pet.notes || ''
      });
    } else if (section === 'vet') {
      setEditValues({
        vetName: pet.vetName || '',
        vetLocation: pet.vetLocation || '',
        vetContact: pet.vetContact || ''
      });
    } else if (section === 'food') {
      setEditValues({
        primaryFood: pet.primaryFood || ''
      });
    }
  };

  const cancelEditingSection = () => {
    setEditingSection(null);
    setEditValues({});
  };

  const saveSection = async () => {
    setSavingSection(true);
    try {
      const updateData = {};
      if (editingSection === 'general') {
        updateData.species = editValues.species;
        updateData.breed = editValues.breed || null;
        updateData.age = editValues.age ? parseInt(editValues.age) : null;
        updateData.weight = editValues.weight ? parseFloat(editValues.weight) : null;
        updateData.notes = editValues.notes || null;
      } else if (editingSection === 'vet') {
        updateData.vetName = editValues.vetName || null;
        updateData.vetLocation = editValues.vetLocation || null;
        updateData.vetContact = editValues.vetContact || null;
      } else if (editingSection === 'food') {
        updateData.primaryFood = editValues.primaryFood || null;
      }

      const updatedPet = await apiFetch(`/api/pets/${petId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      setPet(updatedPet);
      setEditingSection(null);
      setEditValues({});
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSavingSection(false);
    }
  };

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

      <main className="flex justify-center py-16">
        <div className="max-w-6xl px-6 w-full">
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back
          </button>
        </div>

        {/* Pet Name */}
        <div className="mb-48">
          <h1 className="text-5xl font-bold text-gray-900">{pet.name}</h1>
        </div>

        {/* General Section */}
        <div style={{ marginBottom: '30px', paddingBottom: '30px' }} className="border-b border-gray-200">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-2xl font-bold text-gray-900">General</h2>
            {editingSection !== 'general' && (
              <button
                onClick={() => startEditingSection('general')}
                className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium transition"
              >
                Edit
              </button>
            )}
          </div>

          {editingSection === 'general' ? (
            <div className="space-y-6">
              {/* Species */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Species</label>
                <select
                  value={editValues.species}
                  onChange={(e) => setEditValues({ ...editValues, species: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="hamster">Hamster</option>
                  <option value="guinea pig">Guinea Pig</option>
                  <option value="fish">Fish</option>
                  <option value="reptile">Reptile</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Breed</label>
                <input
                  type="text"
                  value={editValues.breed}
                  onChange={(e) => setEditValues({ ...editValues, breed: e.target.value })}
                  placeholder="e.g., Labrador Retriever"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
                />
              </div>

              {/* Age and Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Age</label>
                  <input
                    type="number"
                    value={editValues.age}
                    onChange={(e) => setEditValues({ ...editValues, age: e.target.value })}
                    placeholder="Years"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Weight</label>
                  <input
                    type="number"
                    value={editValues.weight}
                    onChange={(e) => setEditValues({ ...editValues, weight: e.target.value })}
                    placeholder="Lbs/kg"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Notes</label>
                <textarea
                  value={editValues.notes}
                  onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                  placeholder="Any special info..."
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
                />
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelEditingSection}
                  className="flex-1 bg-gray-100 text-gray-900 font-semibold py-2 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSection}
                  disabled={savingSection}
                  className="flex-1 bg-[#39FF14] text-gray-900 font-semibold py-2 rounded-xl hover:opacity-90 transition disabled:opacity-50"
                >
                  {savingSection ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
          )}
          {!editingSection === 'general' && pet.notes && (
            <div className="mt-8">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-gray-700">{pet.notes}</p>
            </div>
          )}
        </div>

        {/* Vet Information Section */}
        {(pet.vetName || pet.vetLocation || pet.vetContact) && (
          <div style={{ marginBottom: '30px', paddingBottom: '30px' }} className="border-b border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Vet Information</h2>
              {editingSection !== 'vet' && (
                <button
                  onClick={() => startEditingSection('vet')}
                  className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium transition"
                >
                  Edit
                </button>
              )}
            </div>

            {editingSection === 'vet' ? (
              <div className="space-y-6">
                {/* Vet Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Vet Name</label>
                  <input
                    type="text"
                    value={editValues.vetName}
                    onChange={(e) => setEditValues({ ...editValues, vetName: e.target.value })}
                    placeholder="e.g., Dr. Smith or Happy Paws Vet"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
                  />
                </div>

                {/* Vet Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Vet Location</label>
                  <input
                    type="text"
                    value={editValues.vetLocation}
                    onChange={(e) => setEditValues({ ...editValues, vetLocation: e.target.value })}
                    placeholder="Clinic address or name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
                  />
                </div>

                {/* Vet Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Vet Contact</label>
                  <input
                    type="tel"
                    value={editValues.vetContact}
                    onChange={(e) => setEditValues({ ...editValues, vetContact: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
                  />
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={cancelEditingSection}
                    className="flex-1 bg-gray-100 text-gray-900 font-semibold py-2 rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={savingSection}
                    className="flex-1 bg-[#39FF14] text-gray-900 font-semibold py-2 rounded-xl hover:opacity-90 transition disabled:opacity-50"
                  >
                    {savingSection ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {pet.vetName && (
                  <div>
                    <p className="text-sm text-gray-500">Veterinarian Name</p>
                    <p className="text-lg text-gray-900">{pet.vetName}</p>
                  </div>
                )}
                {pet.vetLocation && (
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-lg text-gray-900">{pet.vetLocation}</p>
                  </div>
                )}
                {pet.vetContact && (
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="text-lg text-gray-900">{pet.vetContact}</p>
                    <a
                      href={`tel:${pet.vetContact}`}
                      className="mt-3 inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition"
                    >
                      Call Vet Now (Emergency)
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Food Information Section */}
        {pet.primaryFood && (
          <div style={{ marginBottom: '30px', paddingBottom: '30px' }} className="border-b border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Food Information</h2>
              {editingSection !== 'food' && (
                <button
                  onClick={() => startEditingSection('food')}
                  className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium transition"
                >
                  Edit
                </button>
              )}
            </div>

            {editingSection === 'food' ? (
              <div className="space-y-6">
                {/* Primary Food */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Primary Food</label>
                  <input
                    type="text"
                    value={editValues.primaryFood}
                    onChange={(e) => setEditValues({ ...editValues, primaryFood: e.target.value })}
                    placeholder="e.g., Kibble, Wet food, Raw"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
                  />
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={cancelEditingSection}
                    className="flex-1 bg-gray-100 text-gray-900 font-semibold py-2 rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={savingSection}
                    className="flex-1 bg-[#39FF14] text-gray-900 font-semibold py-2 rounded-xl hover:opacity-90 transition disabled:opacity-50"
                  >
                    {savingSection ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Primary Food</p>
                <p className="text-lg text-gray-900">{pet.primaryFood}</p>
              </div>
            )}
          </div>
        )}

        {/* Activity Timeline */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Activity Timeline</h2>
            {activities.length > 0 && (
              <button
                onClick={() => setShowLogActivity(true)}
                className="bg-[#39FF14] text-gray-900 font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
              >
                Create New Activity
              </button>
            )}
          </div>

          {activities.length > 0 && (
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setActivityFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activityFilter === 'all'
                    ? 'bg-[#39FF14] text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActivityFilter('past')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activityFilter === 'past'
                    ? 'bg-[#39FF14] text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ✓ Past
              </button>
              <button
                onClick={() => setActivityFilter('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activityFilter === 'upcoming'
                    ? 'bg-[#39FF14] text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📅 Upcoming
              </button>
            </div>
          )}

          {activities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No activities logged yet</p>
              <button
                onClick={() => setShowLogActivity(true)}
                className="mt-4 bg-[#39FF14] text-gray-900 font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
              >
                Create First Activity
              </button>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">
                {activityFilter === 'past' && 'No past activities'}
                {activityFilter === 'upcoming' && 'No upcoming activities'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-start justify-between">
                  <div className="flex-1">
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
                  <button
                    onClick={() => setEditingActivity(activity)}
                    className="ml-4 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </main>

      {showLogActivity && (
        <LogActivity
          petId={petId}
          onActivityLogged={(newActivity) => {
            setActivities([newActivity, ...activities]);
            setShowLogActivity(false);
          }}
          onClose={() => setShowLogActivity(false)}
        />
      )}

      {editingActivity && (
        <LogActivity
          petId={petId}
          activity={editingActivity}
          onActivityLogged={(updatedActivity) => {
            // Update the activity in the timeline
            setActivities(activities.map(a => 
              a.id === updatedActivity.id ? updatedActivity : a
            ));
            setEditingActivity(null);
          }}
          onActivityDeleted={(activityId) => {
            // Remove the activity from the timeline
            setActivities(activities.filter(a => a.id !== activityId));
            setEditingActivity(null);
          }}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}
