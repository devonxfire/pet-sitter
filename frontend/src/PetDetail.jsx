import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, API_BASE, apiUrl } from './api';
import TopNav from './TopNav';
import LogActivity from './LogActivity';

export default function PetDetail({ household, user, onSignOut }) {
  const navigate = useNavigate();
  const { petId } = useParams();
  const fileInputRef = useRef(null);
  const [pet, setPet] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'past', 'upcoming'
  const [quickActions, setQuickActions] = useState([]);
  const [showManageQuickActions, setShowManageQuickActions] = useState(false);
  const quickActionsRef = useRef(null);
  const [editingSection, setEditingSection] = useState(null); // 'general', 'vet', 'food'
  const [editValues, setEditValues] = useState({});
  const [savingSection, setSavingSection] = useState(false);
  const photoContainerRef = useRef(null);
  const [weightUnit, setWeightUnit] = useState('lbs'); // State for weight unit selection

  const resolvePhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

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

    return () => {
      // no-op cleanup
    };
  }, [petId]);

  // Load quick actions from server; fall back to localStorage
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (household?.id) {
          const serverActions = await apiFetch(`/api/households/${household.id}/quick-actions`);
          if (mounted && Array.isArray(serverActions)) {
            // normalize to { id, key, label, icon, data }
            setQuickActions(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load quick actions from server:', err.message || err);
      }

      // If server fetch fails or no household, set empty list (server-backed only)
      if (mounted) setQuickActions([]);
    };
    load();
    return () => { mounted = false; };
  }, [household?.id]);

  // Expose a loader so child components can refresh quick actions after changes
  const loadQuickActions = async () => {
    try {
      if (!household?.id) return;
      const serverActions = await apiFetch(`/api/households/${household.id}/quick-actions`);
      if (Array.isArray(serverActions)) {
        setQuickActions(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
      }
    } catch (err) {
      console.warn('Failed to refresh quick actions:', err);
    }
  };

  const createQuickAction = async (action) => {
      // action: { key, label, icon, data }
    try {
      // Preferred flow: call server-side replay endpoint when action has an id and household is known
      if (!household?.id) {
        alert('No household context available. Quick Actions require a household.');
        return;
      }

      if (!action?.id) {
        console.error('Quick action missing id', { action });
        alert('Quick action is missing an id. Try refreshing the Quick Actions list.');
        return;
      }

      if (action.id && household?.id) {
        // Use raw fetch so we can show server error details if the replay fails
        const token = localStorage.getItem('token');
        const replayUrl = apiUrl(`/api/households/${household.id}/quick-actions/${action.id}/replay`);
        console.log('Replay request', { replayUrl, householdId: household?.id, actionId: action?.id });
        const resp = await fetch(replayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ petId: petId ? parseInt(petId) : undefined })
        });

        let body = null;
        try { body = await resp.json(); } catch (e) { body = null; }

        console.log('Replay response', { status: resp.status, body });

        if (!resp.ok) {
          console.error('Replay error payload:', body);
          const msg = body?.error || (body?.message) || `HTTP ${resp.status}`;
          const details = body?.details ? `\n\n${body.details}` : '';
          alert(`Failed to replay quick action: ${msg}${details}`);
          return;
        }

        const created = body;
        if (Array.isArray(created) && created.length > 0) {
          setActivities((prev) => [...created, ...(prev || [])]);
        }
        // refresh quick actions list
        try {
          const serverActions = await apiFetch(`/api/households/${household.id}/quick-actions`);
          if (Array.isArray(serverActions)) setQuickActions(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
        } catch (err) {
          // ignore
        }
        return;
      }

      // Non-server quick-actions are not supported anymore
      alert('This quick action is not available. Quick Actions are server-backed only.');
    } catch (err) {
      console.error('Failed to create quick action activity', err);
      alert(err.message || 'Failed to create activity');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!confirm('Delete this activity? This cannot be undone.')) return;
    try {
      await apiFetch(`/api/activities/${activityId}`, { method: 'DELETE' });
      setActivities((prev) => prev.filter(a => a.id !== activityId));
      if (editingActivity && editingActivity.id === activityId) setEditingActivity(null);
    } catch (err) {
      console.error('Failed to delete activity', err);
      alert(err.message || 'Failed to delete activity');
    }
  };

  const handleDeleteQuickAction = async (qa) => {
    try {
      if (!confirm('Delete this Quick Action? This will remove the shortcut but will NOT delete any previously logged activities.')) return;

      if (qa.id && household?.id) {
        const resp = await apiFetch(`/api/households/${household.id}/quick-actions/${qa.id}`, { method: 'DELETE' });
        console.log('Deleted quick action response', resp);
      } else {
        throw new Error('Cannot delete quick action: not a server-backed action');
      }

      // refresh list
      const serverActions = await apiFetch(`/api/households/${household.id}/quick-actions`);
      setQuickActions(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
    } catch (err) {
      console.error('Failed to delete quick action', err);
      alert(err.message || 'Failed to delete quick action');
    }
  };

  const renderedQuickActions = quickActions || [];

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

  const startEditingSection = (section) => {
    setEditingSection(section);
    if (section === 'general') {
      setEditValues({
        species: pet.species,
        breed: pet.breed || '',
        age: pet.age?.toString() || '',
        weight: pet.weight?.toString() || '',
        weightUnit: pet.weightUnit || 'lbs',
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
        updateData.weightUnit = editValues.weightUnit || 'lbs';
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('photo', file);

      console.log('Uploading photo:', file.name, file.type);

      const uploadUrl = apiUrl(`/api/pets/${petId}/photo`);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      console.log('Upload response status:', response.status);
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        throw new Error(text || 'Failed to upload photo');
      }
      console.log('Upload response data:', data);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to upload photo');
      }

      console.log('Updated pet with photo:', data);
      setPet(data);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to upload photo';
      setError(errorMessage);
      console.error('Photo upload error:', err);
      alert(`Upload failed: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
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
            onClick={() => navigate('/dashboard')}
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
            onClick={() => navigate('/dashboard')}
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
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </button>
        </div>

        {/* Pet Name */}
        <div className="mb-8 flex flex-col items-center gap-6">
          {/* Circular Photo */}
          <div className="relative">
            <div
              ref={photoContainerRef}
              className="w-40 h-40 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center overflow-hidden"
            >
              {pet.photoUrl ? (
                <img
                  src={resolvePhotoUrl(pet.photoUrl)}
                  alt={pet.name}
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                />
              ) : (
                <div className="text-gray-400 text-6xl">📷</div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-accent hover:opacity-90 text-white rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition text-lg"
              type="button"
            >
              ➕
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e)}
              className="hidden"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 text-center">{pet.name}</h1>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Weight</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={editValues.weight}
                      onChange={(e) => setEditValues({ ...editValues, weight: e.target.value })}
                      placeholder="Weight"
                      min="0"
                      step="0.1"
                      className="w-24 px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                    />
                    <select
                      value={editValues.weightUnit}
                      onChange={e => setEditValues({ ...editValues, weightUnit: e.target.value })}
                      className="px-2 py-2 rounded-lg border border-gray-200 focus:border-accent focus:outline-none bg-white text-gray-900"
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
                  className="flex-1 bg-accent text-gray-900 font-semibold py-2 rounded-xl hover:opacity-90 transition disabled:opacity-50"
                >
                  {savingSection ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Species</p>
                <p className="text-lg font-semibold text-gray-900">{pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}</p>
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
                  <p className="text-lg font-semibold text-gray-900">{pet.weight} {pet.weightUnit ? pet.weightUnit : 'lbs'}</p>
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

        {/* Activity Timeline */}
        <div style={{ marginBottom: '30px', paddingBottom: '30px' }} className="border-b border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Activity Timeline</h2>
            {activities.length > 0 && (
              <button
                onClick={() => setShowLogActivity(true)}
                className="bg-accent text-gray-900 font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
              >
                Create New Activity
              </button>
            )}
          </div>

          {activities.length > 0 && (
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => {
                  setActivityFilter('quick');
                  setTimeout(() => quickActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activityFilter === 'quick'
                    ? 'bg-accent text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Quick Actions
              </button>
              <button
                onClick={() => setActivityFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activityFilter === 'all'
                    ? 'bg-accent text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActivityFilter('past')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activityFilter === 'past'
                    ? 'bg-accent text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ✓ Past
              </button>
              <button
                onClick={() => setActivityFilter('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activityFilter === 'upcoming'
                    ? 'bg-accent text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📅 Upcoming
              </button>
            </div>
          )}

          {(() => {
            if (activities.length === 0) {
              return (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">No activities logged yet</p>
                  <button
                    onClick={() => setShowLogActivity(true)}
                    className="mt-4 bg-accent text-gray-900 font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
                  >
                    Create First Activity
                  </button>
                </div>
              );
            }

            if (activityFilter === 'quick') {
              if (renderedQuickActions.length === 0) {
                return (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No current quick actions</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {renderedQuickActions.map((qa) => (
                    <div key={`qa-${qa.id}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900">{qa.label}</p>
                          <time className="text-sm text-gray-500">{qa.createdAt ? new Date(qa.createdAt).toLocaleString() : ''}</time>
                        </div>
                        {qa.data?.notes && (
                          <p className="text-gray-700 text-sm">{qa.data.notes}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Quick Action</p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <button
                          onClick={() => createQuickAction(qa)}
                          className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                        >
                          Log
                        </button>
                        <button
                          onClick={() => handleDeleteQuickAction(qa)}
                          className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            if (filteredActivities.length === 0) {
              return (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">
                    {activityFilter === 'past' && 'No past activities'}
                    {activityFilter === 'upcoming' && 'No upcoming activities'}
                  </p>
                </div>
              );
            }

            return (
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
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={() => setEditingActivity(activity)}
                        className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
                    className="flex-1 bg-accent text-gray-900 font-semibold py-2 rounded-xl hover:opacity-90 transition disabled:opacity-50"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
                    className="flex-1 bg-accent text-gray-900 font-semibold py-2 rounded-xl hover:opacity-90 transition disabled:opacity-50"
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

        
        </div>
      </main>

      {showLogActivity && (
        <LogActivity
          petId={petId}
          household={household}
          onActivityLogged={(newActivity) => {
            setActivities([newActivity, ...activities]);
            setShowLogActivity(false);
          }}
          onClose={() => setShowLogActivity(false)}
          onQuickActionsUpdated={loadQuickActions}
        />
      )}

      {editingActivity && (
        <LogActivity
          petId={petId}
          household={household}
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
          onQuickActionsUpdated={loadQuickActions}
        />
      )}
    </div>
  );
}
