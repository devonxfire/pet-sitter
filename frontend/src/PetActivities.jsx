import React, { useEffect, useState, useRef } from 'react';
import ThemeSpinner from './ThemeSpinner';
import { getPetQuote } from './petQuotes';
import { generateGroupId } from './groupId';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, apiUrl, API_BASE } from './api';
import PetActivityGraph from './PetActivityGraph.jsx';
import LogActivity from './LogActivity';
import ActivityView from './ActivityView';
import ACTIVITY_TYPES from './activityTypes';
import ConfirmDialog from './ConfirmDialog';
import ModalClose from './ModalClose';


function FavouritesModal({ favourites, onLog, onDelete, onClose }) {
  // Helper to format pet names for display
  function formatPetNames(petNames) {
    if (!Array.isArray(petNames) || petNames.length === 0) return '';
    if (petNames.length === 1) return petNames[0];
    if (petNames.length === 2) return petNames.join(' and ');
    return petNames.slice(0, -1).join(', ') + ' and ' + petNames[petNames.length - 1];
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-2xl shadow-xl w-full relative"
        style={{
          maxWidth: '640px',
          padding: '1.25rem',
          ...(window.innerWidth < 640 ? { maxWidth: '92vw', padding: '0.75rem' } : {}),
        }}
      >
        <ModalClose onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold" />
            <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center sm:text-left">Favourites</h2>
        {(!favourites || favourites.length === 0) ? (
          <div className="text-center py-8"><p className="text-gray-500">No current Favourites</p></div>
        ) : (
          <div className="space-y-4">
            {favourites.map((qa) => {
              // Try to get pet names from data.petNames, fallback to nothing
              const petNames = Array.isArray(qa.data?.petNames) ? qa.data.petNames : [];
              const petNamesStr = petNames.length > 0 ? formatPetNames(petNames) : '';
              const labelWithPets = petNamesStr
                ? `${qa.label} for ${petNamesStr}`
                : qa.label;
              // Determine activity image (same logic as PetDetail)
              const activityTypeLower = (qa.key || qa.label || '').toLowerCase();
              let imgName = 'other-activity.png';
              if (activityTypeLower.includes('play')) imgName = 'play-activity.png';
              else if (activityTypeLower.includes('walk')) imgName = 'walk-activity.png';
              else if (activityTypeLower.includes('feed') || activityTypeLower.includes('food')) imgName = 'food-activity.png';
              else if (activityTypeLower.includes('water')) imgName = 'water-activity.png';
              else if (activityTypeLower.includes('groom')) imgName = 'grooming-activity.png';
              else if (activityTypeLower.includes('medicat')) imgName = 'medication-activity.png';
              else if (activityTypeLower.includes('chill')) imgName = 'chill-activity.png';
              return (
                <div key={`qa-${qa.id}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-start justify-between">
                  <div className="flex items-center flex-1">
                    <img src={`/${imgName}`} alt={qa.label} style={{ width: '56px', height: '40px', objectFit: 'contain', marginRight: '1rem', borderRadius: 0, boxShadow: 'none' }} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">{labelWithPets}</p>
                        <span className="text-sm text-gray-500">{new Date().toLocaleString()}</span>
                      </div>
                      {qa.data?.notes && (<p className="text-gray-700 text-sm">{qa.data.notes}</p>)}
                      <p className="text-xs text-gray-500 mt-2">Favourite</p>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => onLog(qa)}
                      className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                      style={{ cursor: 'pointer', minWidth: '80px' }}
                    >
                      Log
                    </button>
                    <button
                      onClick={() => onDelete(qa)}
                      className="px-3 py-2 text-sm font-medium text-accent hover:bg-gray-100 rounded-lg transition no-global-accent no-accent-hover delete-btn"
                      style={{ color: 'var(--brand-red)', cursor: 'pointer', minWidth: '80px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


export default function PetActivities({ household, user, onSignOut, pet: propPet, activities: propActivities, disableInternalFetch }) {
  const navigate = useNavigate();
  const { petId, householdId: paramHouseholdId } = useParams();
  const [householdPets, setHouseholdPets] = useState([]);
  // Keep a local pets array in sync with householdPets for reliable pet name lookups
  const [pets, setPets] = useState([]);
  useEffect(() => {
    if (Array.isArray(householdPets) && householdPets.length > 0) {
      setPets(householdPets);
    }
  }, [householdPets]);
  const [pet, setPet] = useState(propPet || null);
  const [activities, setActivities] = useState(propActivities || []);
  const [loading, setLoading] = useState(true);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [logStep, setLogStep] = useState('selectType');
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
  const [showPetMenu, setShowPetMenu] = useState(false);
  const petMenuRef = useRef(null);
  const changePetBtnRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const favouritesRef = useRef(null);
  const favBtnRef = useRef(null);
  const [favHover, setFavHover] = useState(false);
  const [showFavouritesModal, setShowFavouritesModal] = useState(false);



  useEffect(() => {
    const apply = () => {
      const dels = document.querySelectorAll('.delete-btn');
      dels.forEach(el => {
        el.style.setProperty('color', 'var(--brand-red)', 'important');
      });
    };
    apply();
    return () => {};
  }, [activities]);

  const parseTimestamp = (ts) => {
    if (!ts) return new Date(NaN);
    try {
      if (typeof ts === 'string') {
        const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z)?$/;
        const m = ts.match(isoLike);
        if (m) { if (!m[1]) return new Date(ts + 'Z'); }
      }
      return new Date(ts);
    } catch (e) { return new Date(ts); }
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
    if (disableInternalFetch) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const p = await apiFetch(`/api/pets/${petId}`);
        const a = await apiFetch(`/api/pets/${petId}/activities`);
        if (!cancelled) { setPet(p); setActivities(a || []); }
      } catch (err) { console.error('Failed to load activities page', err); } finally { if (!cancelled) setLoading(false); }
    };
    if (petId) load();

    // Listen for cross-window/socket events so remote activity changes update instantly
    const handleNew = (e) => {
      try {
        const activity = e?.detail?.activity;
        if (!activity) return;
        const targetPetId = petId ? parseInt(petId) : null;
        const activityPetId = activity.petId || (activity.pet && activity.pet.id) || activity.pet?.id || null;
        if (targetPetId && activityPetId && parseInt(activityPetId) !== targetPetId) return;
        setActivities((prev = []) => {
          // Always deduplicate by id
          const idStr = String(activity.id);
          const filtered = prev.filter(a => String(a.id) !== idStr);
          return [activity, ...filtered];
        });
      } catch (err) {}
    };

    const handleUpdated = (e) => {
      try {
        const activity = e?.detail?.activity;
        if (!activity) return;
        const targetPetId = petId ? parseInt(petId) : null;
        const activityPetId = activity.petId || (activity.pet && activity.pet.id) || activity.pet?.id || null;
        if (targetPetId && activityPetId && parseInt(activityPetId) !== targetPetId) return;
        // prefer editedBy for display when provided
        if (activity.editedBy) activity.user = activity.editedBy;
        setActivities((prev = []) => prev.map(a => String(a.id) === String(activity.id) ? activity : a));
      } catch (err) {}
    };

    const handleDeleted = (e) => {
      try {
        const activityId = e?.detail?.activityId;
        if (!activityId) return;
        setActivities((prev = []) => prev.filter(a => String(a.id) !== String(activityId)));
      } catch (err) {}
    };

    window.addEventListener('petSitter:newActivity', handleNew);
    window.addEventListener('petSitter:updatedActivity', handleUpdated);
    window.addEventListener('petSitter:deletedActivity', handleDeleted);

    return () => { cancelled = true; window.removeEventListener('petSitter:newActivity', handleNew); window.removeEventListener('petSitter:updatedActivity', handleUpdated); window.removeEventListener('petSitter:deletedActivity', handleDeleted); };
  }, [petId, disableInternalFetch]);

  // Flower mapping for household pets (so flowers are unique in a household)
  const [flowerMap, setFlowerMap] = useState({});
  const handleTogglePetMenu = async () => {
    // Toggle immediately for responsive UI, then lazily load pets if needed
    // compute button position for fixed placement using the button ref
    try {
      const btn = changePetBtnRef.current || petMenuRef.current;
      if (btn && typeof btn.getBoundingClientRect === 'function') {
        const r = btn.getBoundingClientRect();
        setMenuPos({ left: r.left + window.scrollX, top: r.bottom + window.scrollY, width: r.width });
      }
    } catch (e) {}
    setShowPetMenu(s => !s);
    console.log('[PetActivities] toggle pet menu, now open:', !showPetMenu);
    if (!household?.id) return;
    if (!householdPets || householdPets.length === 0) {
      try {
        const data = await apiFetch(`/api/households/${household.id}/pets`);
        if (Array.isArray(data)) setHouseholdPets(data);
      } catch (e) {
        // ignore load errors
      }
    }
  };
  useEffect(() => {
    let cancelled = false;
    const loadHouseholdPets = async () => {
      try {
        if (!household?.id) return;
        if (Array.isArray(household.pets) && household.pets.length > 0) {
          if (!cancelled) {
            setFlowerMap(assignHouseholdFlowers(household.pets));
            setHouseholdPets(household.pets);
          }
          return;
        }
        const data = await apiFetch(`/api/households/${household.id}/pets`);
        if (!cancelled && Array.isArray(data)) {
          setFlowerMap(assignHouseholdFlowers(data));
          setHouseholdPets(data);
        }
      } catch (err) {}
    };
    loadHouseholdPets();
    return () => { cancelled = true; };
  }, [household?.id]);

  const resolvePhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // list of household pets excluding the current one (so we don't navigate to same page)
  const otherPets = (Array.isArray(householdPets) ? householdPets.filter(p => String(p.id) !== String(petId)) : []);

  // Hover debounce for activity graph: delay opening modal to avoid flicker
  const hoverTimer = useRef(null);
  const HOVER_OPEN_DELAY = 200; // ms

  const handleHoverActivity = (act) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setViewingActivity(act);
      hoverTimer.current = null;
    }, HOVER_OPEN_DELAY);
  };

  const handleLeaveActivity = () => {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    setViewingActivity(null);
  };

  useEffect(() => {
    return () => { if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; } };
  }, []);

  const loadFavourites = async () => {
    try {
      if (!household?.id) return;
      const serverActions = await apiFetch(`/api/households/${household.id}/favourites`);
      if (Array.isArray(serverActions)) {
        setFavourites(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null, createdAt: a.createdAt })));
      }
    } catch (err) { console.warn('Failed to refresh favourites:', err); }
  };

  useEffect(() => { if (household?.id) loadFavourites(); }, [household?.id]);

  const createFavourite = async (action) => {
    try {
      if (!household?.id) { alert('No household context available. Favourites require a household.'); return; }
      if (!action?.id) { console.error('Favourite missing id', { action }); alert('Favourite is missing an id. Try refreshing the Favourites list.'); return; }
      if (action.id && household?.id) {
        const token = localStorage.getItem('token');
        const replayUrl = apiUrl(`/api/households/${household.id}/favourites/${action.id}/replay`);
        const petIds = Array.isArray(action.data?.petIds) && action.data.petIds.length > 0
          ? action.data.petIds
          : [petId ? parseInt(petId) : undefined];
        // Only POST to server, do not update local activities state
        if (petIds.length > 1) {
          const groupId = action.data?.groupId || generateGroupId();
          await Promise.all(petIds.map(async pid => {
            const payload = {
              activityTypeId: action.key,
              timestamp: new Date().toISOString(),
              notes: action.data?.notes || '',
              data: { petNames: action.data?.petNames || [], petIds, groupId },
            };
            await fetch(apiUrl(`/api/pets/${pid}/activities`), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify(payload)
            });
          }));
        } else {
          const payload = {
            petId: petIds[0],
            timestamp: new Date().toISOString()
          };
          await fetch(replayUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(payload)
          });
        }
        // Always reload favourites from server and close modal
        await loadFavourites();
        setShowFavouritesModal(false);
        return;
      }
      alert('This Favourite is not available. Favourites are server-backed only.');
    } catch (err) {
      console.error('Failed to create favourite activity', err);
      alert(err.message || 'Failed to create activity');
    }
  };

  const handleDeleteActivity = (activityId) => {
    // show confirm dialog (actual delete performed in confirm handler)
    setConfirmDeleteId(activityId);
  };

  const performDeleteActivity = async (activityId) => {
    try {
      await apiFetch(`/api/activities/${activityId}`, { method: 'DELETE' });
      setActivities((prev) => prev.filter(a => String(a.id) !== String(activityId)));
      if (viewingActivity && String(viewingActivity.id) === String(activityId)) setViewingActivity(null);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete activity', err);
      alert(err.message || 'Failed to delete activity');
      setConfirmDeleteId(null);
    }
  };

  const handleDeleteFavourite = async (qa) => {
    try {
      if (!confirm('Delete this Favourite? This will remove the favourite but will NOT delete any previously logged activities.')) return;
      if (qa.id && household?.id) {
        const resp = await apiFetch(`/api/households/${household.id}/favourites/${qa.id}`, { method: 'DELETE' });
        const serverActions = await apiFetch(`/api/households/${household.id}/favourites`);
        setFavourites(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
      } else { throw new Error('Cannot delete favourite: not a server-backed action'); }
    } catch (err) { console.error('Failed to delete favourite', err); alert(err.message || 'Failed to delete favourite'); }
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
    // Close pet menu when clicking outside
    useEffect(() => {
      function onDocClick(e) {
        if (!showPetMenu) return;
        const clicked = e.target;
        const insideButton = changePetBtnRef.current && changePetBtnRef.current.contains(clicked);
        const insideMenu = menuRef.current && menuRef.current.contains(clicked);
        if (!insideButton && !insideMenu) {
          setShowPetMenu(false);
        }
      }
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }, [showPetMenu]);

    // Force inline important styles on the pet menu to override global theme rules
    useEffect(() => {
      if (!menuRef.current) return;
      const el = menuRef.current;
      if (!showPetMenu) return;
      try {
        el.style.setProperty('background', '#ffffff', 'important');
        el.style.setProperty('border-radius', '0.5rem', 'important');
        el.style.setProperty('overflow', 'hidden', 'important');
        el.style.setProperty('box-shadow', '0 8px 24px rgba(0,0,0,0.12)', 'important');

        // also ensure child buttons use white background / dark text
        const buttons = el.querySelectorAll('button');
        buttons.forEach((b) => {
          try {
            b.style.setProperty('background', '#ffffff', 'important');
            b.style.setProperty('color', '#111111', 'important');
            b.style.setProperty('border', 'none', 'important');
          } catch (e) {}
        });
      } catch (e) {
        // swallow errors — this is best-effort defensive styling
      }
    }, [showPetMenu]);

  // Ensure the Change pet button text stays white and has no background (use setProperty with priority)
  useEffect(() => {
    const el = changePetBtnRef.current;
    if (!el) return;
    try {
      el.style.setProperty('color', '#ffffff', 'important');
      el.style.setProperty('background', 'none', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.setProperty('border', 'none', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
      el.style.setProperty('outline', 'none', 'important');
    } catch (e) {}
  }, []);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  // Deduplicate multi-pet activities for display: group by timestamp+type+petIds
  function dedupeMultiPetActivities(activities) {
    const groups = {};
    activities.forEach(a => {
      // Use petNames as the grouping key for multi-pet activities
      let petNamesKey = '';
      if (Array.isArray(a.data?.petNames)) {
        petNamesKey = [...a.data.petNames].sort().join(',');
      }
      const key = `${a.activityTypeId || a.activityType?.id || ''}|${(a.timestamp || '').slice(0,16)}|${petNamesKey}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return Object.values(groups).map(group => {
      if (group.length === 1) return group[0];
      // Merge into one activity with all petIds and all petNames
      const merged = { ...group[0] };
      merged.data = {
        ...merged.data,
        petNames: Array.from(new Set(group.flatMap(g => Array.isArray(g.data?.petNames) ? g.data.petNames : []))),
        petIds: Array.from(new Set(group.flatMap(g => Array.isArray(g.data?.petIds) ? g.data.petIds : (g.petId ? [g.petId] : []))))
      };
      return merged;
    });
  }
  const visibleActivities = dedupeMultiPetActivities(sortedActivities).slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  if (loading) return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <ThemeSpinner label="Loading activities..." />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">

      {/* Header band: match PetDetail header UI for consistency */}
      <div
        className="w-full"
        style={{
          backgroundColor: '#f3f4f6',
          background: '#f3f4f6',
          color: '#111',
          zIndex: 2,
          position: 'relative',
        }}
      >
        <div style={{position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none'}}>
          <div style={{width: '100%', height: '100%', position: 'relative'}}>
            <div style={{width: '100%', height: '100%', backgroundImage: 'url(/hero-pets.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(1)'}} />
            <div style={{position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.45)'}} />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 w-full relative" style={{zIndex: 1}}>
          <div className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              {/* Avatar */}
              <div className="relative flex flex-col items-center">
                <button
                  onClick={() => navigate(`/pet/${petId}`)}
                  aria-label={pet ? `Open ${pet.name} details` : 'Open pet details'}
                  className="focus:outline-none focus:ring-0 no-global-accent no-accent-hover cursor-pointer hover:opacity-95"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                  type="button"
                >
                  <div className="w-28 h-28 md:w-40 md:h-40 rounded-2xl bg-gray-200 border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                    {pet?.photoUrl ? (
                      <img src={resolvePhotoUrl(pet.photoUrl)} alt={pet?.name || 'Pet'} className="w-full h-full object-cover select-none" draggable={false} style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.18)' }} />
                    ) : (
                      <div className="text-gray-400 text-4xl">📷</div>
                    )}
                  </div>
                </button>
              </div>
              {/* Main info and actions centered below avatar */}
              <div className="flex flex-col items-center w-full">
                <h1 className="text-2xl md:text-4xl leading-tight text-center">
                  {pet ? (
                    <>
                      <span className="font-bold text-white">{pet.name}'s </span>
                      <span className="heading-light text-white" data-heading="Activities">Activities</span>
                    </>
                  ) : (
                    <span className="heading-light text-white" data-heading="Activities">Activities</span>
                  )}
                </h1>
                <div className="mt-2 flex flex-row items-center gap-2 text-sm text-white">
                  {activities && activities.length > 0 ? (
                    <>
                      <span>Latest Activity:</span>
                      <span className="inline-flex items-center gap-2 px-2 py-0.5 bg-gray-100 rounded-full text-sm">
                        {(() => {
                          const latest = activities.slice().sort((a, b) => {
                            const ta = parseTimestamp(a.timestamp).getTime() || 0;
                            const tb = parseTimestamp(b.timestamp).getTime() || 0;
                            return tb - ta;
                          })[0];
                          if (!latest) return null;
                          const name = latest.activityType?.name?.toLowerCase() || '';
                          let imgName = 'other-activity.png';
                          if (name.includes('play')) imgName = 'play-activity.png';
                          else if (name.includes('walk')) imgName = 'walk-activity.png';
                          else if (name.includes('feed') || name.includes('food')) imgName = 'food-activity.png';
                          else if (name.includes('water')) imgName = 'water-activity.png';
                          else if (name.includes('groom')) imgName = 'grooming-activity.png';
                          else if (name.includes('medicat')) imgName = 'medication-activity.png';
                          else if (name.includes('chill')) imgName = 'chill-activity.png';
                          return (
                            <img src={`/${imgName}`} alt={name} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                          );
                        })()}
                        <span className="text-sm font-medium text-gray-900">{(() => {
                          const latest = activities.slice().sort((a, b) => {
                            const ta = parseTimestamp(a.timestamp).getTime() || 0;
                            const tb = parseTimestamp(b.timestamp).getTime() || 0;
                            return tb - ta;
                          })[0];
                          return latest && latest.activityType?.name
                            ? `${latest.activityType.name.charAt(0).toUpperCase()}${latest.activityType.name.slice(1)}`
                            : 'Activity';
                        })()}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Last Activity:</span>
                      <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-sm text-gray-200">No activities logged yet.</span>
                    </>
                  )}
                </div>
                <blockquote className="italic max-w-lg text-lg md:text-xl leading-tight mt-4 text-center" style={{ fontFamily: `'Dancing Script', cursive`, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>
                  <span>“{getPetQuote(pet?.name)}”</span>
                </blockquote>
                <div className="flex flex-row items-center gap-3 mt-4 justify-center">
                   
                                      <button
                    onClick={() => navigate(`/pet/${petId}`)}
                    className="flex items-center gap-2 px-4 py-2 text-base font-normal transition cursor-pointer petdetail-action-btn shadow"
                    ref={el => {
                      if (el) {
                        el.style.setProperty('background', '#C3001F', 'important');
                        el.style.setProperty('background-color', '#C3001F', 'important');
                        el.style.setProperty('color', '#fff', 'important');
                        el.style.setProperty('box-shadow', '0 4px 16px 0 rgba(0,0,0,0.18)', 'important');
                        el.style.setProperty('border-radius', '0.75rem', 'important');
                      }
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.setProperty('background', '#8B0016', 'important');
                      e.currentTarget.style.setProperty('background-color', '#8B0016', 'important');
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.setProperty('background', '#C3001F', 'important');
                      e.currentTarget.style.setProperty('background-color', '#C3001F', 'important');
                    }}
                    aria-label={`View ${pet?.name || ''}'s Profile`}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
                    </svg>
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => navigate(`/pet/${petId}/activities`)}
                    className="flex items-center gap-2 px-4 py-2 text-base font-normal transition cursor-pointer petdetail-action-btn shadow"
                    ref={el => {
                      if (el) {
                        el.style.setProperty('background', '#C3001F', 'important');
                        el.style.setProperty('background-color', '#C3001F', 'important');
                        el.style.setProperty('color', '#fff', 'important');
                        el.style.setProperty('box-shadow', '0 4px 16px 0 rgba(0,0,0,0.18)', 'important');
                        el.style.setProperty('border-radius', '0.75rem', 'important');
                      }
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.setProperty('background', '#8B0016', 'important');
                      e.currentTarget.style.setProperty('background-color', '#8B0016', 'important');
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.setProperty('background', '#C3001F', 'important');
                      e.currentTarget.style.setProperty('background-color', '#C3001F', 'important');
                    }}
                    aria-label={`View ${pet?.name || ''}'s Activities`}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>Activities</span>
                  </button>
                  <button
                    onClick={() => {
                      const hid = paramHouseholdId || household?.id;
                      if (hid) {
                        navigate(`/household/${hid}/calendar`);
                      } else {
                        alert('Household not found for this pet.');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-base font-normal transition cursor-pointer petdetail-action-btn shadow"
                    ref={el => {
                      if (el) {
                        el.style.setProperty('background', '#C3001F', 'important');
                        el.style.setProperty('background-color', '#C3001F', 'important');
                        el.style.setProperty('color', '#fff', 'important');
                        el.style.setProperty('box-shadow', '0 4px 16px 0 rgba(0,0,0,0.18)', 'important');
                        el.style.setProperty('border-radius', '0.75rem', 'important');
                      }
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.setProperty('background', '#8B0016', 'important');
                      e.currentTarget.style.setProperty('background-color', '#8B0016', 'important');
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.setProperty('background', '#C3001F', 'important');
                      e.currentTarget.style.setProperty('background-color', '#C3001F', 'important');
                    }}
                    aria-label={`View ${pet?.name || ''}'s Calendar`}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <span>Calendar</span>
                  </button>

                  <button
                    onClick={() => setShowLogActivity('food')}
                    className="flex items-center gap-2 px-4 py-2 text-base font-normal transition cursor-pointer petdetail-action-btn shadow"
                    ref={el => {
                      if (el) {
                        el.style.setProperty('background', '#C3001F', 'important');
                        el.style.setProperty('background-color', '#C3001F', 'important');
                        el.style.setProperty('color', '#fff', 'important');
                        el.style.setProperty('box-shadow', '0 4px 16px 0 rgba(0,0,0,0.18)', 'important');
                        el.style.setProperty('border-radius', '0.75rem', 'important');
                      }
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.setProperty('background', '#8B0016', 'important');
                      e.currentTarget.style.setProperty('background-color', '#8B0016', 'important');
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.setProperty('background', '#C3001F', 'important');
                      e.currentTarget.style.setProperty('background-color', '#C3001F', 'important');
                    }}
                    aria-label="Log Food"
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <line x1="12" y1="4" x2="12" y2="20" />
                      <line x1="9" y1="4" x2="9" y2="10" />
                      <line x1="15" y1="4" x2="15" y2="10" />
                    </svg>
                    <span>Food</span>
                  </button>
                  <button
                    onClick={() => setShowLogActivity('medication')}
                    className="flex items-center gap-2 px-4 py-2 text-base font-normal transition cursor-pointer petdetail-action-btn shadow"
                    ref={el => {
                      if (el) {
                        el.style.setProperty('background', '#C3001F', 'important');
                        el.style.setProperty('background-color', '#C3001F', 'important');
                        el.style.setProperty('color', '#fff', 'important');
                        el.style.setProperty('box-shadow', '0 4px 16px 0 rgba(0,0,0,0.18)', 'important');
                        el.style.setProperty('border-radius', '0.75rem', 'important');
                      }
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.setProperty('background', '#8B0016', 'important');
                      e.currentTarget.style.setProperty('background-color', '#8B0016', 'important');
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.setProperty('background', '#C3001F', 'important');
                      e.currentTarget.style.setProperty('background-color', '#C3001F', 'important');
                    }}
                    aria-label="Log Medication"
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <rect x="4" y="10" width="16" height="8" rx="4" />
                      <line x1="8" y1="14" x2="16" y2="14" />
                    </svg>
                    <span>Medication</span>
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 w-full py-8">
        {/* Log Activity and Favourites buttons ABOVE the graph */}
        <div className="flex flex-row gap-2 w-full mb-8">
          <button
            onClick={() => setShowLogActivity(true)}
            className="flex items-center gap-2 px-4 py-2 text-base font-normal transition cursor-pointer shadow w-1/2 sm:w-auto"
            ref={el => {
              if (el) {
                el.style.setProperty('background', '#10B981', 'important'); // green-500
                el.style.setProperty('background-color', '#10B981', 'important');
                el.style.setProperty('color', '#fff', 'important');
                el.style.setProperty('box-shadow', '0 4px 16px 0 rgba(0,0,0,0.18)', 'important');
                el.style.setProperty('border-radius', '0.75rem', 'important');
                el.style.setProperty('min-width', '110px', 'important');
              }
            }}
            onMouseEnter={e => {
              e.currentTarget.style.setProperty('background', '#059669', 'important'); // green-600
              e.currentTarget.style.setProperty('background-color', '#059669', 'important');
            }}
            onMouseLeave={e => {
              e.currentTarget.style.setProperty('background', '#10B981', 'important');
              e.currentTarget.style.setProperty('background-color', '#10B981', 'important');
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Log New Activity
          </button>
          <button
            onClick={() => setShowFavouritesModal(true)}
            aria-pressed={activityFilter === 'quick'}
            ref={el => {
              favBtnRef.current = el;
              if (el) {
                el.style.setProperty('background', activityFilter === 'quick' ? '#E5E7EB' : '#F3F4F6', 'important');
                el.style.setProperty('box-shadow', '0 4px 16px 0 rgba(0,0,0,0.18)', 'important');
                el.style.setProperty('border-radius', '0.75rem', 'important');
                el.style.setProperty('color', '#111827', 'important');
              }
            }}
            className="inline-flex items-center gap-2 text-gray-900 font-medium text-base px-4 py-2 transition no-global-accent no-accent-hover cursor-pointer shadow w-1/2 sm:w-auto"
            onMouseEnter={e => {
              if (activityFilter !== 'quick') {
                e.currentTarget.style.setProperty('background', '#E5E7EB', 'important');
              }
            }}
            onMouseLeave={e => {
              if (activityFilter !== 'quick') {
                e.currentTarget.style.setProperty('background', '#F3F4F6', 'important');
              }
            }}
          >
            <svg className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C3001F" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.01 4.01 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 17.99 4 20 6.01 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            <span>Favourites</span>
          </button>
        </div>
        {/* Activity scatter plot graph */}
        {activities && activities.length > 0 && (
          <PetActivityGraph
            activities={activities}
            onHoverActivity={handleHoverActivity}
            onClickActivity={(act) => {
              // Immediate open on click (cancel pending hover timers)
              if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
              setViewingActivity(act);
            }}
            onLeaveActivity={handleLeaveActivity}
          />
        )}
        <div className="flex justify-between items-center mb-8 mt-6 flex-wrap gap-2">
          <div className="flex gap-2 items-center flex-wrap">
            <button onClick={() => setActivityFilter('all')} className={`px-2 py-1 rounded-md text-sm font-medium transition no-global-accent no-accent-hover cursor-pointer ${activityFilter === 'all' ? 'bg-gray-200 selected-filter' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
            <button onClick={() => setActivityFilter('past')} className={`px-2 py-1 rounded-md text-sm font-medium transition no-global-accent no-accent-hover cursor-pointer ${activityFilter === 'past' ? 'bg-gray-200 selected-filter' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>✓ Past</button>
            <button onClick={() => setActivityFilter('upcoming')} className={`px-2 py-1 rounded-md text-sm font-medium transition no-global-accent no-accent-hover cursor-pointer ${activityFilter === 'upcoming' ? 'bg-gray-200 selected-filter' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>📅 Upcoming</button>
            {/* Activity type dropdown filter */}
            <label className="ml-4 mr-1 text-sm font-medium text-gray-700" htmlFor="activity-type-filter">Type</label>
            <select
              id="activity-type-filter"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-2 py-1 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ minWidth: 120 }}
              aria-label="Filter by activity type"
            >
              <option value="all">All Types</option>
              {Array.from(new Set(
                (activities || [])
                  .map(a => a.activityType?.name)
                  .filter(Boolean)
                  .map(name => name.charAt(0).toUpperCase() + name.slice(1))
              ))
                .sort((a, b) => a.localeCompare(b))
                .map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Filter activities by typeFilter */}
        {activityFilter !== 'quick' && typeFilter !== 'all' && activities && (
          (() => {
            // Only show activities matching the selected type
            const filtered = activities.filter(a => {
              const n = a.activityType?.name;
              return n && n.charAt(0).toUpperCase() + n.slice(1) === typeFilter;
            });
            if (filtered.length === 0) return <div className="text-center text-gray-500 mb-8">No activities of this type.</div>;
            return null; // Let the main list render as normal, since the main activity list uses activities already filtered by typeFilter
          })()
        )}

        

        <div className="flex flex-col space-y-4">
          {visibleActivities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl"><p className="text-gray-500">No activities logged yet</p></div>
          ) : (
            visibleActivities.map(activity => {
              // Conversational phrasing logic (mirrors NotificationBell VERB_TEMPLATES)
              const VERB_TEMPLATES = {
                feeding: { past: 'was fed', future: 'is scheduled for feeding' },
                walk: { past: 'had a walk', future: 'has a walk scheduled' },
                play: { past: 'played', future: 'has playtime scheduled' },
                medication: { past: 'was given medication', future: 'has medication scheduled' },
                water: { past: 'was given water', future: 'has water scheduled' },
                grooming: { past: 'was groomed', future: 'has grooming scheduled' },
                chilling: { past: 'chilled out', future: 'is scheduled to chill' },
                other: { past: 'had an activity', future: 'has an activity scheduled' }
              };
              const now = new Date();
              const when = parseTimestamp(activity.timestamp);
              const isFuture = when > now;
              const petName = pet?.name || activity.pet?.name || '';
              let petNames = petName;
              if (Array.isArray(activity.data?.petNames) && activity.data.petNames.length > 1) {
                let names = [...activity.data.petNames];
                // Move current pet's name to the front if present
                if (petName && names.includes(petName)) {
                  names = [petName, ...names.filter(n => n !== petName)];
                }
                if (names.length === 2) {
                  petNames = names.join(' and ');
                } else {
                  petNames = names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
                }
              } else if (Array.isArray(activity.data?.petNames) && activity.data.petNames.length === 1) {
                petNames = activity.data.petNames[0];
              }
              const rawLabel = (activity._clientActionLabel || activity.activityType?.name || activity.activityType?.label || activity.type || 'Activity');
              const actionKey = String(rawLabel).toLowerCase().trim();
              const tmpl = VERB_TEMPLATES[actionKey] || VERB_TEMPLATES[Object.keys(VERB_TEMPLATES).find(k => actionKey.includes(k))] || null;
              let heading = rawLabel;
              const isUpdated = activity._updatedActivity === true;
              // Pluralize all verbs for multi-pet activities
              let pluralPast = null;
              if (Array.isArray(activity.data?.petNames) && activity.data.petNames.length > 1 && tmpl && tmpl.past) {
                // crude pluralization: 'was' -> 'were', 'had' -> 'had', 'played' -> 'played', etc.
                if (tmpl.past.startsWith('was ')) {
                  pluralPast = 'were ' + tmpl.past.slice(4);
                } else if (tmpl.past.startsWith('is ')) {
                  pluralPast = 'are ' + tmpl.past.slice(3);
                } else if (tmpl.past.startsWith('has ')) {
                  pluralPast = 'have ' + tmpl.past.slice(4);
                } else {
                  pluralPast = tmpl.past; // fallback: unchanged
                }
              }
              if (petNames) {
                if (tmpl || pluralPast) {
                  const pastVerb = pluralPast || tmpl.past;
                  if (isUpdated) {
                    heading = isFuture
                      ? `Future ${rawLabel.toLowerCase()} updated for ${petNames}`
                      : `${petNames} ${pastVerb} (updated)`;
                  } else {
                    heading = isFuture
                      ? `Future ${rawLabel.toLowerCase()} organised for ${petNames}`
                      : `${petNames} ${pastVerb}`;
                  }
                } else {
                  const lowerAct = rawLabel.toLowerCase();
                  if (isFuture) {
                    heading = isUpdated
                      ? `Future ${lowerAct} updated for ${petNames}`
                      : `Future ${lowerAct} organised for ${petNames}`;
                  } else {
                    const article = /^[aeiou]/.test(lowerAct) ? 'an' : 'a';
                    heading = isUpdated
                      ? `${petNames} had ${article} ${lowerAct} (updated)`
                      : `${petNames} — Had ${article} ${lowerAct}`;
                  }
                }
              }
              // Find the image name for the activity type
              let imgName = (activity.activityType?.name || activity.activityType?.id || '').toLowerCase().replace(/\s+/g, '-') + '-activity.png';
              if (
                activity.activityType?.id === 'feeding' ||
                activity.activityType?.name === 'feeding'
              ) imgName = 'food-activity.png';
              if (
                activity.activityType?.id === 'chilling' ||
                activity.activityType?.name === 'chilling'
              ) imgName = 'chill-activity.png';
              return (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex flex-col items-center text-center gap-2 mb-2 sm:flex-row sm:items-start sm:text-left sm:gap-0 sm:justify-between">
                    <div className="flex flex-col items-center w-full sm:flex-row sm:items-center sm:w-auto">
                      <img src={`/${imgName}`} alt={activity.activityType?.label || activity.activityType?.name || 'Activity'} className="w-20 h-20 mb-2 sm:w-14 sm:h-14 sm:mb-0 object-contain mx-auto sm:mx-0" />
                      <div className="flex-1 min-w-0 sm:ml-4">
                        <p className="font-semibold text-gray-900 break-words">
                          {heading}
                        </p>
                        {activity.notes && <p className="text-gray-700 text-sm mt-1 break-words">{activity.notes}</p>}
                        {activity.user && <p className="text-xs text-gray-500 mt-2">by {activity.user.name}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-center w-full gap-2 sm:flex-row sm:items-center sm:w-auto sm:ml-4 sm:gap-2 sm:justify-end">
                      <time className="text-sm text-gray-500 whitespace-nowrap">{when.toLocaleString()}</time>
                      <div className="flex flex-row w-full gap-2 sm:w-auto sm:flex-row sm:gap-2">
                        <button onClick={() => setViewingActivity(activity)} className="w-full sm:w-auto px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition no-global-accent no-accent-hover cursor-pointer">View</button>
                        <button onClick={() => setEditingActivity(activity)} className="w-full sm:w-auto px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-md transition no-global-accent no-accent-hover cursor-pointer">Edit</button>
                        <button onClick={() => handleDeleteActivity(activity.id)} className="w-full sm:w-auto px-2 py-1 text-sm font-medium text-accent hover:bg-red-50 rounded-md transition no-global-accent no-accent-hover delete-btn cursor-pointer" style={{ color: 'var(--brand-red)' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">Showing {visibleActivities.length} of {totalItems} activities</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-200 transition no-global-accent no-accent-hover">Prev</button>
            <div className="px-3 py-1">{clampedPage} / {totalPages}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-200 transition no-global-accent no-accent-hover">Next</button>
          </div>
        </div>
      </div>

      {showLogActivity && (
        <LogActivity
          petId={petId}
          household={household}
          user={user}
          step={logStep}
          setStep={setLogStep}
          onActivityLogged={(newActivity) => {
            try {
              const normalized = { ...newActivity };
              // prefer server-provided user, then editedBy, then current user prop
              if (!normalized.user) normalized.user = normalized.editedBy || user || null;
              setActivities(prev => [normalized, ...prev]);
            } catch (e) {
              setActivities(prev => [newActivity, ...prev]);
            }
            setShowLogActivity(false);
            setLogStep('selectType');
          }}
          onClose={() => {
            console.log('[PetActivities] LogActivity onClose called');
            setShowLogActivity(false);
            setLogStep('selectType');
          }}
          onFavouritesUpdated={loadFavourites}
        />
      )}

      {editingActivity && (
        <LogActivity
          petId={petId}
          household={household}
          user={user}
          activity={editingActivity}
          onActivityLogged={(updatedActivity) => {
            try {
              const normalized = { ...updatedActivity };
              if (!normalized.user) normalized.user = normalized.editedBy || user || null;
              setActivities(prev => prev.map(a => String(a.id) === String(normalized.id) ? normalized : a));
            } catch (e) {
              setActivities(prev => prev.map(a => String(a.id) === String(updatedActivity.id) ? updatedActivity : a));
            }
            setEditingActivity(null);
          }}
          onActivityDeleted={(activityId) => { setActivities(prev => prev.filter(a => String(a.id) !== String(activityId))); setEditingActivity(null); }}
          onClose={() => setEditingActivity(null)}
          onFavouritesUpdated={loadFavourites}
        />
      )}

      {viewingActivity && (
        <ActivityView activity={viewingActivity} onClose={() => setViewingActivity(null)} onEdit={(act) => { setViewingActivity(null); setEditingActivity(act); }} onDelete={(id) => { setViewingActivity(null); setActivities(prev => prev.filter(a => String(a.id) !== String(id))); }} />
      )}


      {confirmDeleteId && (() => {
        // Find the activity to delete
        const activity = activities.find(a => String(a.id) === String(confirmDeleteId));
        let extraWarning = '';
        let petNames = [];
        if (activity && Array.isArray(activity.data?.petIds) && activity.data.petIds.length > 1) {
          // Try to resolve pet names from householdPets
          petNames = (householdPets || []).filter(p => activity.data.petIds.includes(p.id)).map(p => p.name);
          if (petNames.length > 0) {
            extraWarning = `\n\nThis will delete this activity for ALL these pets: ${petNames.join(', ')}.`;
          } else {
            extraWarning = `\n\nThis will delete this activity for ALL pets involved.`;
          }
        }
        return (
          <ConfirmDialog
            title="Delete activity"
            message={`Delete this activity? This cannot be undone.${extraWarning}`}
            onConfirm={() => performDeleteActivity(confirmDeleteId)}
            onCancel={() => setConfirmDeleteId(null)}
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
        );
      })()}

        {showFavouritesModal && (
          <FavouritesModal
            favourites={favourites}
            onLog={createFavourite}
            onDelete={handleDeleteFavourite}
            onClose={() => setShowFavouritesModal(false)}
          />
        )}

        {/* Pet switcher removed — cleaned up leftover references */}

    </div>
  );
}