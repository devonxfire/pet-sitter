import React, { useEffect, useState, useRef } from 'react';
import { apiFetch, API_BASE } from './api';
import { io as makeIo } from 'socket.io-client';
import ACTIVITY_TYPES, { getActivityLabel } from './activityTypes';
import { Link, useNavigate } from 'react-router-dom';

function timeAgo(ts) {
  try {
    const d = new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return `${Math.floor(diff/86400)}d`;
  } catch (e) { return '' }
}

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return '' }
}

const VERB_TEMPLATES = {
  feeding: { past: 'was fed', future: 'is scheduled for feeding' },
  walk: { past: 'had a walk', future: 'has a walk scheduled' },
  play: { past: 'played', future: 'has playtime scheduled' },
  medication: { past: 'was given medication', future: 'has medication scheduled' },
  water: { past: 'was given water', future: 'has water scheduled' },
  grooming: { past: 'was groomed', future: 'has grooming scheduled' },
  photo: { past: 'had a photo taken', future: 'has a photo scheduled' },
  other: { past: 'had an activity', future: 'has an activity scheduled' }
};

export default function NotificationBell({ navigate }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('petSitter:notifications') || '[]'); } catch (e) { return []; }
  });
  const [justReceived, setJustReceived] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('petSitter:notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Enrich any stored notifications that only have numeric titles by fetching activity-type metadata
  useEffect(() => {
    let mounted = true;
    async function enrich() {
      try {
        const updates = [];
        for (const n of notifications) {
          if ((!n.actionLabel || String(n.actionLabel).trim() === '') && /^\d+$/.test(String(n.title || ''))) {
            const id = String(n.title);

            // 1) try local ACTIVITY_TYPES by index
            const idx = parseInt(id, 10);
            if (!Number.isNaN(idx) && idx > 0 && idx <= ACTIVITY_TYPES.length) {
              updates.push({ id: n.id, actionLabel: ACTIVITY_TYPES[idx - 1].label });
              continue;
            }

            // 2) try backend by id
            try {
              const at = await apiFetch(`/api/activity-types/${id}`);
              if (at && (at.label || at.name)) {
                updates.push({ id: n.id, actionLabel: at.label || at.name });
                continue;
              }
            } catch (e) {
              // try listing
              try {
                const all = await apiFetch('/api/activity-types');
                if (Array.isArray(all)) {
                  const found = all.find(x => String(x.id) === id);
                  if (found) updates.push({ id: n.id, actionLabel: found.label || found.name });
                }
              } catch (e2) {
                // ignore
              }
            }
          }
        }
        if (!mounted) return;
        if (updates.length > 0) {
          setNotifications(prev => prev.map(item => {
            const u = updates.find(x => x.id === item.id);
            return u ? { ...item, actionLabel: u.actionLabel } : item;
          }));
        }
      } catch (err) {
        // ignore enrichment errors
      }
    }
    enrich();
    return () => { mounted = false; };
  }, []);

  // Handle deletions broadcast from other tabs
  useEffect(() => {
    const delHandler = (e) => {
      const activityId = e?.detail?.activityId;
      if (!activityId) return;
      setNotifications(prev => prev.filter(n => String(n.id) !== String(activityId)));
    };
    window.addEventListener('petSitter:deletedActivity', delHandler);
    return () => window.removeEventListener('petSitter:deletedActivity', delHandler);
  }, []);

  useEffect(() => {
    const handler = async (e) => {
      const activity = e?.detail?.activity;
      if (!activity) return;
      // Determine a human label for the activity. Prefer client-provided fallback if present.
      let mappedLabel = activity._clientActionLabel || getActivityLabel(activity.activityTypeId) || activity.activityType?.label || activity.activityType?.name || activity.type || null;
      // If the server only provided a numeric activityTypeId, try fetching activity type info from the API
      if (!mappedLabel && activity.activityTypeId && /^\d+$/.test(String(activity.activityTypeId))) {
        try {
          const at = await apiFetch(`/api/activity-types/${activity.activityTypeId}`);
          if (at && (at.label || at.name)) mappedLabel = at.label || at.name;
        } catch (err) {
          try {
            const all = await apiFetch(`/api/activity-types`);
            if (Array.isArray(all)) {
              const found = all.find(x => String(x.id) === String(activity.activityTypeId));
              if (found) mappedLabel = found.label || found.name || null;
            }
          } catch (e) {
            // ignore
          }
        }
      }

      const label = mappedLabel || 'Activity';
      const petId = activity.petId || activity.pet_id || activity.pet?.id || null;
      const userName = activity.user?.name || activity.createdBy || null;
      const petNameFromActivity = activity.pet?.name || activity.petName || null;

      const n = {
        id: activity.id || `tmp-${Date.now()}`,
        title: label,
        actionLabel: label,
        body: activity.notes || '',
        petId,
        petName: petNameFromActivity,
        userName,
        timestamp: activity.timestamp || new Date().toISOString(),
        read: false
      };

      setNotifications(prev => {
        if (prev.some(item => String(item.id) === String(n.id))) return prev;
        return [n, ...prev].slice(0, 50);
      });

      // If the action label is numeric (e.g. server returned an id), try to resolve it to a friendly label.
      const tryResolveActionLabel = async () => {
        let resolved = n.actionLabel;
        if (!resolved || /^\d+$/.test(String(resolved).trim())) {
          // 1) check nested activityType object
          if (activity.activityType && (activity.activityType.label || activity.activityType.name)) {
            resolved = activity.activityType.label || activity.activityType.name;
          }

          // 2) try local mapping via getActivityLabel
          if ((!resolved || /^\d+$/.test(String(resolved).trim())) && activity.activityTypeId) {
            const local = getActivityLabel(activity.activityTypeId);
            if (local) resolved = local;
          }

          // 3) try mapping numeric to ACTIVITY_TYPES by index (last resort)
          if ((!resolved || /^\d+$/.test(String(resolved).trim())) && /^\d+$/.test(String(activity.activityTypeId || '').trim())) {
            const idx = parseInt(String(activity.activityTypeId), 10);
            if (!Number.isNaN(idx) && idx > 0 && idx <= ACTIVITY_TYPES.length) {
              resolved = ACTIVITY_TYPES[idx - 1].label;
            }
          }

          // 4) try fetching from backend activity-types endpoint
          if ((!resolved || /^\d+$/.test(String(resolved).trim())) && activity.activityTypeId) {
            try {
              const at = await apiFetch(`/api/activity-types/${activity.activityTypeId}`);
              if (at && (at.label || at.name)) resolved = at.label || at.name;
            } catch (err) {
              try {
                const all = await apiFetch('/api/activity-types');
                if (Array.isArray(all)) {
                  const found = all.find(x => String(x.id) === String(activity.activityTypeId));
                  if (found) resolved = found.label || found.name || resolved;
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }

        if (resolved && resolved !== n.actionLabel) {
          setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, actionLabel: resolved, title: resolved } : item));
        }
      };
      tryResolveActionLabel();

      // If we don't have a pet name, try to fetch it async
      if (!n.petName && n.petId) {
        try {
          const pet = await apiFetch(`/api/pets/${n.petId}`);
          if (pet && pet.name) {
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, petName: pet.name } : item));
          }
        } catch (err) {
          // ignore fetch errors; pet name is optional for notification display
          console.warn('Failed to fetch pet name for notification', err);
        }
      }

      // trigger a brief visual pulse on the bell
      setJustReceived(true);
      setTimeout(() => setJustReceived(false), 3000);
    };
    window.addEventListener('petSitter:newActivity', handler);
    // Also listen for storage events so other tabs/windows receive notifications
    const storageHandler = (ev) => {
      try {
        if (!ev?.key) return;
        if (ev.key === 'petSitter:latestActivity' && ev.newValue) {
          const payload = JSON.parse(ev.newValue);
          if (payload && payload.activity) {
            try { window.dispatchEvent(new CustomEvent('petSitter:newActivity', { detail: { activity: payload.activity } })); } catch (e) {}
          }
        }
        if (ev.key === 'petSitter:deletedActivity' && ev.newValue) {
          const payload = JSON.parse(ev.newValue);
          if (payload && payload.activityId) {
            try { window.dispatchEvent(new CustomEvent('petSitter:deletedActivity', { detail: { activityId: payload.activityId } })); } catch (e) {}
          }
        }
      } catch (err) {
        // ignore storage parse errors
      }
    };
    window.addEventListener('storage', storageHandler);

    // Socket.IO: real-time updates (cross-device)
    let socket;
    try {
      const token = localStorage.getItem('token');
      // Prefer WebSocket transport to avoid polling GET issues in some dev setups
      socket = makeIo(API_BASE, { auth: { token }, transports: ['websocket'] });

      socket.on('connect', async () => {
        console.debug('Socket connected', socket.id);
        // Join all households the user belongs to so they receive household-level events
        try {
          const households = await apiFetch('/api/households');
          if (Array.isArray(households)) {
            households.forEach(h => {
              console.debug('Joining household via socket', h.id);
              try { socket.emit('joinHousehold', h.id); } catch (e) {}
            });
          }
        } catch (err) {
          // ignore
        }
      });

      socket.on('newActivity', (payload) => {
        console.debug('socket newActivity received', payload);
        try { window.dispatchEvent(new CustomEvent('petSitter:newActivity', { detail: { activity: payload.activity } })); } catch (e) { console.warn('dispatch newActivity failed', e); }
      });

      socket.on('updatedActivity', (payload) => {
        console.debug('socket updatedActivity received', payload);
        try { window.dispatchEvent(new CustomEvent('petSitter:updatedActivity', { detail: { activity: payload.activity } })); } catch (e) { console.warn('dispatch updatedActivity failed', e); }
      });

      socket.on('deletedActivity', (payload) => {
        console.debug('socket deletedActivity received', payload);
        try { window.dispatchEvent(new CustomEvent('petSitter:deletedActivity', { detail: { activityId: payload.activityId } })); } catch (e) { console.warn('dispatch deletedActivity failed', e); }
      });
      socket.on('connect_error', (err) => {
        console.error('socket connect_error', err && err.message ? err.message : err);
      });
      socket.on('error', (err) => {
        console.error('socket error', err);
      });
    } catch (err) {
      console.warn('Socket.IO init failed', err);
    }
    return () => {
      window.removeEventListener('petSitter:newActivity', handler);
      window.removeEventListener('storage', storageHandler);
      if (socket) try { socket.disconnect(); } catch (e) {}
    };
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  const unread = notifications.filter(n => !n.read).length;

  const handleClickNotification = (n) => {
    // mark read
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    setOpen(false);
    if (n.petId) {
      try { navigate(`/pet/${n.petId}`); } catch (e) { window.location.href = `/pet/${n.petId}`; }
    }
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(s => !s); if (!open) { /* opening */ } }}
        className="relative p-2 rounded-full text-gray-600 hover:text-gray-800 hover:opacity-90 focus:outline-none no-accent-hover no-global-accent"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none notif-badge">{unread}</span>
        )}
        {justReceived && (
          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent opacity-30 animate-ping pointer-events-none" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div className="font-semibold text-gray-700">Notifications</div>
            <button onClick={markAllRead} className="text-sm text-gray-500 hover:underline no-accent-hover no-global-accent">Mark all read</button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No notifications</div>
            ) : notifications.map(n => {
                const rawTitle = (typeof n.title === 'string') ? n.title : (n.title && (n.title.name || n.title.label)) || String(n.title || 'Activity');
                const titleText = String(rawTitle || 'Activity');
                const actionLabel = (n.actionLabel && String(n.actionLabel)) || titleText;
                const actionKey = (actionLabel || '').toLowerCase().trim();
                const now = new Date();
                const when = n.timestamp ? new Date(n.timestamp) : now;
                const isFuture = when > now;
                // Compose human friendly description using templates when possible
                let heading = titleText;
                let subline = `at ${formatTime(n.timestamp)}`;
                if (n.petName) {
                  const tmpl = VERB_TEMPLATES[actionKey];
                  if (tmpl) {
                    if (isFuture) {
                      // e.g. "Future walk organised for Lilly"
                      heading = `Future ${actionLabel.toLowerCase()} organised for ${n.petName}`;
                    } else {
                      // e.g. "Lilly — was fed"
                      heading = `${n.petName} — ${tmpl.past}`;
                    }
                  } else {
                    // Fallback phrasing — pick the correct indefinite article (a/an)
                    const lowerAct = actionLabel.toLowerCase();
                    if (isFuture) {
                      heading = `Future ${lowerAct} organised for ${n.petName}`;
                    } else {
                      const article = /^[aeiou]/.test(lowerAct) ? 'an' : 'a';
                      heading = `${n.petName} — Had ${article} ${lowerAct}`;
                    }
                  }
                } else {
                  heading = titleText;
                }
                if (n.userName) subline += `, by ${n.userName}`;
                return (
                  <div key={n.id} onClick={() => handleClickNotification(n)} className={`px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${n.read ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="pr-4 flex-1">
                        <div className="text-sm font-medium text-gray-900">{heading}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {n.body && <span className="block truncate">{n.body}</span>}
                          <span className="block">{subline}</span>
                        </div>
                      </div>
                      <div className="ml-2 flex flex-col items-end">
                        <div className="text-xs text-gray-400">{timeAgo(n.timestamp)}</div>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); setNotifications(prev => prev.filter(item => item.id !== n.id)); }}
                          aria-label="Dismiss notification"
                          className="text-gray-400 hover:text-gray-600 mt-1 no-accent-hover no-global-accent"
                          title="Dismiss"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="p-3 text-center">
            <Link to="/dashboard" className="text-sm text-accent hover:underline">View all</Link>
          </div>
        </div>
      )}
    </div>
  );
}
