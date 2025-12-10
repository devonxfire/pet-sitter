import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from './api';
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">← Back</button>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Activities — {pet ? pet.name : ''}</h1>
            <p className="text-sm text-gray-500">All logged activities for this pet</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogActivity(true)}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-xl font-semibold bg-accent-hover text-white hover:bg-gray-100 hover:text-gray-900 transition"
            >
              <svg className="w-5 h-5 text-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Create New Activity</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 items-center">
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
        </div>

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
          onFavouritesUpdated={() => {}}
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
          onFavouritesUpdated={() => {}}
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
