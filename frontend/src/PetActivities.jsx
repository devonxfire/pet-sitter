import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, apiUrl } from './api';
import TopNav from './TopNav';
import LogActivity from './LogActivity';
import ActivityView from './ActivityView';
import ACTIVITY_TYPES from './activityTypes';

export default function PetActivities({ household, user, onSignOut }) {
  const navigate = useNavigate();
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [viewingActivity, setViewingActivity] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('newest');
  const [typeFilter, setTypeFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favourites, setFavourites] = useState([]);
  const favouritesRef = useRef(null);

  const parseTimestamp = (ts) => {
    if (!ts) return new Date(NaN);
    try {
      if (typeof ts === 'string') {
        const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z)?$/;
        const m = ts.match(isoLike);
        if (m) {
          if (!m[1]) return new Date(ts + 'Z');
        }
      }
      return new Date(ts);
    } catch (e) {
      return new Date(ts);
    }
  };

  const getActivityIcon = (name) => {
    if (!name) return '•';
    const key = name.toLowerCase();
    if (key.includes('feed')) return '🍽️';
    if (key.includes('walk')) return '🚶';
    if (key.includes('water')) return '💧';
    if (key.includes('groom')) return '🛁';
    if (key.includes('medicat')) return '💊';
    if (key.includes('play')) return '🎾';
    if (key.includes('photo')) return '📸';
    return '📝';
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const p = await apiFetch(`/api/pets/${petId}`);
        const a = await apiFetch(`/api/pets/${petId}/activities`);
        if (!cancelled) {
          setPet(p);
          setActivities(a || []);
        }
      } catch (err) {
        console.error('Failed to load activities page', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (petId) load();
    return () => { cancelled = true; };
  }, [petId]);

  // Load favourites for household
  const loadFavourites = async () => {
    try {
      if (!household?.id) return;
      const serverActions = await apiFetch(`/api/households/${household.id}/favourites`);
      if (Array.isArray(serverActions)) {
        setFavourites(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null, createdAt: a.createdAt })));
      }
    } catch (err) {
      console.warn('Failed to refresh favourites:', err);
    }
  };

  useEffect(() => {
    if (household?.id) loadFavourites();
  }, [household?.id]);

  const createFavourite = async (action) => {
    try {
      if (!household?.id) {
        alert('No household context available. Favourites require a household.');
        return;
      }

      if (!action?.id) {
        console.error('Favourite missing id', { action });
        alert('Favourite is missing an id. Try refreshing the Favourites list.');
        return;
      }

      if (action.id && household?.id) {
        const token = localStorage.getItem('token');
        const replayUrl = apiUrl(`/api/households/${household.id}/favourites/${action.id}/replay`);
        const resp = await fetch(replayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ petId: petId ? parseInt(petId) : undefined, timestamp: new Date().toISOString() })
        });

        let body = null;
        try { body = await resp.json(); } catch (e) { body = null; }

        if (!resp.ok) {
          const msg = body?.error || (body?.message) || `HTTP ${resp.status}`;
          alert(`Failed to apply Favourite: ${msg}`);
          return;
        }

        const created = body;
        if (Array.isArray(created) && created.length > 0) {
          setActivities((prev = []) => {
            const existingIds = new Set(prev.map(a => String(a.id)));
            const toAdd = created.filter(c => !existingIds.has(String(c.id)));
            if (toAdd.length === 0) return prev;
            return [...toAdd, ...prev];
          });
        }

        // refresh favourites list
        try { await loadFavourites(); } catch (e) {}
        return;
      }

      alert('This Favourite is not available. Favourites are server-backed only.');
    } catch (err) {
      console.error('Failed to create favourite activity', err);
      alert(err.message || 'Failed to create activity');
    }
  };

  const handleDeleteFavourite = async (qa) => {
    try {
      if (!confirm('Delete this Favourite? This will remove the favourite but will NOT delete any previously logged activities.')) return;

      if (qa.id && household?.id) {
        const resp = await apiFetch(`/api/households/${household.id}/favourites/${qa.id}`, { method: 'DELETE' });
        // refresh list
        const serverActions = await apiFetch(`/api/households/${household.id}/favourites`);
        setFavourites(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
      } else {
        throw new Error('Cannot delete favourite: not a server-backed action');
      }
    } catch (err) {
      console.error('Failed to delete favourite', err);
      alert(err.message || 'Failed to delete favourite');
    }
  };

  const timeFilteredActivities = activities.filter(activity => {
    const activityTime = parseTimestamp(activity.timestamp);
    const now = new Date();
    if (activityFilter === 'past') return activityTime <= now;
    if (activityFilter === 'upcoming') return activityTime > now;
    return true;
  });

  const activityKey = (a) => (a._clientActionLabel || a.activityType?.name || a.activityType?.label || a.type || '').toString().toLowerCase();

  const searchedActivities = timeFilteredActivities.filter(a => {
    if (memberFilter && memberFilter !== 'all') {
      const mf = String(memberFilter);
      if (!a.user) return false;
      const uid = a.user.id ? String(a.user.id) : '';
      const uname = (a.user.name || '').toLowerCase();
      const uemail = (a.user.email || '').toLowerCase();
      if (uid === mf) {
      } else if (uemail === mf.toLowerCase()) {
      } else if (uname === mf.toLowerCase()) {
      } else return false;
    }
    if (typeFilter && typeFilter !== 'all') {
      const key = activityKey(a);
      const candidate = String(typeFilter).toLowerCase();
      if (!key.includes(candidate) && !String(a.activityType?.id || '').toLowerCase().includes(candidate)) return false;
    }
    if (searchQuery && String(searchQuery).trim() !== '') {
      const q = String(searchQuery).toLowerCase();
      const hay = [a.notes || '', a.user?.name || '', activityKey(a)].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sortedActivities = searchedActivities.slice().sort((a, b) => {
    const ta = parseTimestamp(a.timestamp).getTime() || 0;
    const tb = parseTimestamp(b.timestamp).getTime() || 0;
    return sortOrder === 'newest' ? tb - ta : ta - tb;
  });

  const totalItems = sortedActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const visibleActivities = sortedActivities.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  if (loading) return (
    <div className="min-h-screen bg-white">
      <TopNav user={user} household={household} onSignOut={onSignOut} />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-gray-500">Loading activities...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <TopNav user={user} household={household} onSignOut={onSignOut} />

      <div className="mx-auto max-w-6xl px-6 w-full py-8">
        <div className="flex items-start justify-between mb-8">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{pet ? `${pet.name}'s Activities` : 'Activities'}</h1>
            <p className="text-sm text-gray-500">All logged activities for this pet — <button onClick={() => navigate('/activities')} className="text-sm text-accent underline">Change pet</button></p>

            {/* Action row: Create + Favourites (under the header) */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setShowLogActivity(true)}
                className="inline-flex items-center gap-3 px-5 py-2 rounded-xl font-semibold bg-accent text-white hover:opacity-90 transition"
              >
                <svg className="w-5 h-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Log New Activity</span>
              </button>

              <button
                onClick={() => {
                  setActivityFilter('quick');
                  setTimeout(() => favouritesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
                }}
                aria-pressed={activityFilter === 'quick'}
                className={activityFilter === 'quick'
                  ? 'inline-flex items-center gap-3 bg-accent text-white font-semibold px-6 py-2 rounded-xl transition'
                  : 'inline-flex items-center gap-3 bg-gray-100 text-gray-600 font-semibold px-6 py-2 rounded-xl hover:bg-gray-200 transition'
                }
              >
                <svg
                  className={activityFilter === 'quick' ? 'w-5 h-5 text-white flex-shrink-0' : 'w-5 h-5 text-accent flex-shrink-0'}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.01 4.01 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 17.99 4 20 6.01 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>Repeat Favourite</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-8 mt-6 items-center">
          <button
            onClick={() => setActivityFilter('all')}
            className={`px-2 py-1 rounded-md text-sm font-medium transition ${activityFilter === 'all' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >All</button>
          <button
            onClick={() => setActivityFilter('past')}
            className={`px-2 py-1 rounded-md text-sm font-medium transition ${activityFilter === 'past' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >✓ Past</button>
          <button
            onClick={() => setActivityFilter('upcoming')}
            className={`px-2 py-1 rounded-md text-sm font-medium transition ${activityFilter === 'upcoming' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >📅 Upcoming</button>
          {/* Favourites button moved to action row above — duplicate removed */}
        </div>

        {/* Favourites quick-list */}
        {activityFilter === 'quick' && (
          <div ref={favouritesRef} className="mb-6">
            {(!favourites || favourites.length === 0) ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500">No current Favourites</p>
              </div>
            ) : (
              <div className="space-y-4">
                {favourites.map((qa) => (
                  <div key={`qa-${qa.id}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">{qa.label}</p>
                        <time className="text-sm text-gray-500">{qa.createdAt ? new Date(qa.createdAt).toLocaleString() : ''}</time>
                      </div>
                      {qa.data?.notes && (
                        <p className="text-gray-700 text-sm">{qa.data.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Favourite</p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={() => createFavourite(qa)}
                        className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                      >
                        Log
                      </button>
                      <button
                        onClick={() => handleDeleteFavourite(qa)}
                        className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col space-y-4">
          {visibleActivities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No activities logged yet</p>
            </div>
          ) : (
            visibleActivities.map(activity => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-900">{(activity.activityType?.name ? `${activity.activityType.name.charAt(0).toUpperCase()}${activity.activityType.name.slice(1)}` : (activity._clientActionLabel || 'Activity'))}</p>
                    <time className="text-sm text-gray-500">{parseTimestamp(activity.timestamp).toLocaleString()}</time>
                  </div>
                  {activity.notes && <p className="text-gray-700 text-sm">{activity.notes}</p>}
                  {activity.user && <p className="text-xs text-gray-500 mt-2">by {activity.user.name}</p>}
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <button onClick={() => setViewingActivity(activity)} className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition">View</button>
                  <button onClick={() => setEditingActivity(activity)} className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition">Edit</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">Showing {visibleActivities.length} of {totalItems} activities</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-md bg-gray-100">Prev</button>
            <div className="px-3 py-1">{clampedPage} / {totalPages}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-md bg-gray-100">Next</button>
          </div>
        </div>

      </div>

      {showLogActivity && (
        <LogActivity
          petId={petId}
          household={household}
          onActivityLogged={(newActivity) => {
            setActivities(prev => [newActivity, ...prev]);
            setShowLogActivity(false);
          }}
          onClose={() => setShowLogActivity(false)}
          onFavouritesUpdated={loadFavourites}
        />
      )}

      {editingActivity && (
        <LogActivity
          petId={petId}
          household={household}
          activity={editingActivity}
          onActivityLogged={(updatedActivity) => {
            setActivities(prev => prev.map(a => String(a.id) === String(updatedActivity.id) ? updatedActivity : a));
            setEditingActivity(null);
          }}
          onActivityDeleted={(activityId) => {
            setActivities(prev => prev.filter(a => String(a.id) !== String(activityId)));
            setEditingActivity(null);
          }}
          onClose={() => setEditingActivity(null)}
          onFavouritesUpdated={loadFavourites}
        />
      )}

      {viewingActivity && (
        <ActivityView
          activity={viewingActivity}
          onClose={() => setViewingActivity(null)}
          onEdit={(act) => { setViewingActivity(null); setEditingActivity(act); }}
          onDelete={(id) => { setViewingActivity(null); setActivities(prev => prev.filter(a => String(a.id) !== String(id))); }}
        />
      )}

    </div>
  );
}
