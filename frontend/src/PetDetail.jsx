import React, { useState, useEffect, useRef } from 'react';
import ThemeSpinner from './ThemeSpinner';
import { getAgeFromDob } from './components/AddPetWizardModal';

import { getPetQuote } from './petQuotes';

import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, API_BASE, apiUrl } from './api';


import LogActivity from './LogActivity';
import ActivityView from './ActivityView';
import ACTIVITY_TYPES from './activityTypes';
import { Link } from 'react-router-dom';

// AvatarWithLoader: shows a spinner/overlay while image is loading
function AvatarWithLoader({ src, alt }) {
  const [loading, setLoading] = useState(true);
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const [fallbackPassed, setFallbackPassed] = useState(false);
  const [imgError, setImgError] = useState(false);
  // Always add cache-busting param
  const cacheBustedSrc = src ? src + (src.includes('?') ? '&' : '?') + 't=' + Date.now() : '';
  useEffect(() => {
    setLoading(true);
    setMinDelayPassed(false);
    setFallbackPassed(false);
    setImgError(false);
    const timer = setTimeout(() => setMinDelayPassed(true), 400);
    const fallbackTimer = setTimeout(() => setFallbackPassed(true), 5000); // fallback after 5s
    return () => { clearTimeout(timer); clearTimeout(fallbackTimer); };
  }, [src]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!imgError ? (
        <img
          src={cacheBustedSrc}
          alt={alt}
          className={`object-cover w-full h-full transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setImgError(true); }}
          style={{ display: loading && !minDelayPassed ? 'none' : undefined }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10 text-4xl text-gray-400">📷</div>
      )}
      {(loading || !minDelayPassed) && !fallbackPassed && !imgError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10">
          <ThemeSpinner size={32} />
        </div>
      )}
      {fallbackPassed && loading && !imgError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10">
          <span className="text-xs text-gray-500">Image failed to load.</span>
        </div>
      )}
    </div>
  );
}
export default function PetDetail({ household, user, onSignOut }) {
  // --- All state/refs must be declared before use ---
  const [editValues, setEditValues] = useState({});
  const [pet, setPet] = useState(null);
  // Fetch breed list based on species (for edit mode)
  useEffect(() => {
    const species = editValues.species || pet?.species || 'dog';
              const storageKey = `petSitter:breeds:${species}`;
              const capitalizeWords = (s) =>
                s.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
              const setList = (list) => {
                setBreedsList(list);
                try {
                  localStorage.setItem(storageKey, JSON.stringify(list));
                } catch (err) {}
              };
              try {
                const cached = localStorage.getItem(storageKey);
                if (cached) {
                  setBreedsList(JSON.parse(cached));
                  return;
                }
              } catch (err) {}
              if (species === 'dog') {
                fetch('https://dog.ceo/api/breeds/list/all')
                  .then((res) => res.json())
                  .then((data) => {
                    if (data && data.message) {
                      const breeds = Object.entries(data.message)
                        .flatMap(([b, subs]) => {
                          if (Array.isArray(subs) && subs.length) {
                            return subs.map((sub) => capitalizeWords(`${sub} ${b}`));
                          }
                          return capitalizeWords(b);
                        })
                        .sort((a, z) => a.localeCompare(z));
                      setList(breeds);
                    }
                  })
                  .catch(() => {});
                return;
              }
              if (species === 'cat') {
                fetch('https://api.thecatapi.com/v1/breeds')
                  .then((res) => res.json())
                  .then((data) => {
                    if (Array.isArray(data)) {
                      const breeds = data.map((b) => capitalizeWords(b.name)).sort((a, z) => a.localeCompare(z));
                      setList(breeds);
                    }
                  })
                  .catch(() => {});
                return;
              }
              if (species === 'bird') {
                const birds = [
                  'Budgerigar', 'Cockatiel', 'Cockatoo', 'Macaw', 'Conure', 'Lovebird', 'Finch', 'Canary', 'African Grey', 'Parakeet',
                ];
                setList(birds.sort((a, z) => a.localeCompare(z)));
                return;
              }
              setBreedsList([]);
            }, [editValues.species, pet?.species]);
          // --- Breed autocomplete input handler ---
          const updateBreedInput = (value) => {
            setEditValues((prev) => ({ ...prev, breed: value }));
            setFocusedSuggestion(-1);
            if (!value) {
              setBreedSuggestions([]);
              setShowBreedSuggestions(false);
              return;
            }
            const q = value.toLowerCase();
            const matches = breedsList.filter((b) => b.toLowerCase().includes(q)).slice(0, 8);
            setBreedSuggestions(matches);
            setShowBreedSuggestions(matches.length > 0);
          };
        // --- Breed autocomplete state ---
        const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
        const [breedSuggestions, setBreedSuggestions] = useState([]);
        const [breedsList, setBreedsList] = useState([]);
        const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
      // --- Breed autocomplete keydown handler ---
      const handleBreedKeyDown = (e) => {
        if (!showBreedSuggestions || breedSuggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedSuggestion((prev) => {
            const next = Math.min(prev + 1, breedSuggestions.length - 1);
            const el = document.getElementById(`petdetail-breed-suggestion-${next}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
            return next;
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedSuggestion((prev) => {
            const next = Math.max(prev - 1, 0);
            const el = document.getElementById(`petdetail-breed-suggestion-${next}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
            return next;
          });
        } else if (e.key === 'Enter') {
          if (focusedSuggestion >= 0 && focusedSuggestion < breedSuggestions.length) {
            e.preventDefault();
            chooseBreed(breedSuggestions[focusedSuggestion]);
          }
        } else if (e.key === 'Escape') {
          setShowBreedSuggestions(false);
          setFocusedSuggestion(-1);
        }
      };

      // --- Breed autocomplete select handler ---
      const chooseBreed = (breed) => {
        setEditValues((prev) => ({ ...prev, breed }));
        setShowBreedSuggestions(false);
        setFocusedSuggestion(-1);
      };
    // Ref for breed input (for autocomplete/focus)
    const breedInputRef = useRef(null);
    // Ref for breed suggestions dropdown (for accessibility/scroll)
    const suggestionsRef = useRef(null);
  const navigate = useNavigate();
  const { petId } = useParams();
  const fileInputRef = useRef(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [viewingActivity, setViewingActivity] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'past', 'upcoming'
  // UI: pagination, sorting, filtering
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [typeFilter, setTypeFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favourites, setFavourites] = useState([]);
  const [showManageFavourites, setShowManageFavourites] = useState(false);
  const favouritesRef = useRef(null);
  const [editingSection, setEditingSection] = useState(null); // 'general', 'vet', 'food'
  const [savingSection, setSavingSection] = useState(false);
  const photoContainerRef = useRef(null);
  const [weightUnit, setWeightUnit] = useState('lbs'); // State for weight unit selection
  // Collapsible section state: controls whether each section is collapsed
  const [collapsedSections, setCollapsedSections] = useState({ general: false, vet: false, food: false });

  // Determine whether current user may edit pet details.
  // Only owners/main household members should be allowed — exclude roles like 'pet_sitter', 'groomer', etc.
  const isHouseholdMember = (() => {
    try {
      if (!household) return false;
      const members = household.members || household.users || [];
      if (!Array.isArray(members)) return false;
      const me = members.find(m => (
        (m.user && String(m.user.id) === String(user?.id)) ||
        String(m.id) === String(user?.id) ||
        (m.user && String(m.user.email) === String(user?.email))
      ));
      if (!me) return false;
      if (me.isOwner) return true;
      const raw = String(me.role || me.type || me.title || '').replace(/_/g, ' ').toLowerCase();
      // Allow editing for roles that include owner/member/main/admin
      if (/owner|member|main|admin/.test(raw)) return true;
      return false;
    } catch (e) { return false; }
  })();

  // Flower mapping for household pets (so flowers are unique in a household)
  const [flowerMap, setFlowerMap] = useState({});
  useEffect(() => {
    let cancelled = false;
    const loadHouseholdPets = async () => {
      try {
        if (!household?.id) return;
        // Try to use household.pets if already present
        if (Array.isArray(household.pets) && household.pets.length > 0) {
          if (!cancelled) setFlowerMap(assignHouseholdFlowers(household.pets));
          return;
        }
        const data = await apiFetch(`/api/households/${household.id}/pets`);
        if (!cancelled && Array.isArray(data)) setFlowerMap(assignHouseholdFlowers(data));
      } catch (err) {
        // ignore failures — fallback will be used
      }
    };
    loadHouseholdPets();
    return () => { cancelled = true; };
  }, [household?.id]);

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const resolvePhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Always use the latest household.pets from localStorage/state
  const getCurrentHouseholdPets = () => {
    if (household && Array.isArray(household.pets)) return household.pets;
    try {
      const stored = localStorage.getItem('household');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.pets)) return parsed.pets;
      }
    } catch (e) {}
    return [];
  };
  const siblingLinks = (pet && getCurrentHouseholdPets().length > 0)
    ? getCurrentHouseholdPets()
        .filter(p => p && p.id && p.name && String(p.id) !== String(pet.id))
        .map(s => (
          <Link
            key={s.id}
            to={`/pet/${s.id}`}
            className="text-accent hover:underline cursor-pointer mr-2"
            onClick={e => e.stopPropagation()}
          >
            {s.name}
          </Link>
        ))
    : [];

  // Parse timestamp strings reliably. If the string lacks timezone info, assume UTC
  // so displayed local time matches the moment intended by the server/client.
  const parseTimestamp = (ts) => {
    if (!ts) return new Date(NaN);
    try {
      if (typeof ts === 'string') {
        // ISO-like without timezone (e.g. "2025-12-08T10:00:00" or "2025-12-08T10:00")
        const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z)?$/;
        const m = ts.match(isoLike);
        if (m) {
          // If there's no trailing Z (timezone), treat it as UTC by appending Z.
          if (!m[1]) return new Date(ts + 'Z');
        }
      }
      return new Date(ts);
    } catch (e) {
      return new Date(ts);
    }
  };

  // Filter activities based on selected filter (time filter)
  const timeFilteredActivities = activities.filter(activity => {
    const activityTime = parseTimestamp(activity.timestamp);
    const now = new Date();
    if (activityFilter === 'past') return activityTime <= now;
    if (activityFilter === 'upcoming') return activityTime > now;
    return true; // 'all'
  });

  // Member options: prefer household members if provided, otherwise derive from activities
  const memberOptions = (() => {
    const hw = household && (household.members || household.users || []);
    if (Array.isArray(hw) && hw.length) {
      // Normalize household member shape to { id: string, name, email }
      return hw.map(m => {
        if (m.user) {
          const uname = m.user.name || ([m.user.firstName, m.user.lastName].filter(Boolean).join(' ').trim()) || m.user.email || '';
          return { id: String(m.user.id), name: uname || String(m.user.id), email: m.user.email || '' };
        }
        // invited member record
        return { id: String(m.id), name: m.invitedEmail || m.email || `Invite ${m.id}`, email: m.invitedEmail || m.email || '' };
      });
    }

    const seen = new Set();
    const list = [];
    (activities || []).forEach(a => {
      const u = a.user;
      if (u && (u.id || u.name)) {
        const key = String(u.id || u.name);
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ id: String(u.id || key), name: u.name || u.email || String(u.id), email: u.email || '' });
        }
      }
    });
    return list;
  })();

  // Helper: normalize activity label/key for matching
  const activityKey = (a) => (a._clientActionLabel || a.activityType?.name || a.activityType?.label || a.type || '').toString().toLowerCase();

  // Apply type filter and search
  const searchedActivities = timeFilteredActivities.filter(a => {
    // Member filter (who logged the activity)
    if (memberFilter && memberFilter !== 'all') {
      const mf = String(memberFilter);
      if (!a.user) return false;
      const uid = a.user.id ? String(a.user.id) : '';
      const uname = (a.user.name || '').toLowerCase();
      const uemail = (a.user.email || '').toLowerCase();
      if (uid === mf) {
        // matched by id
      } else if (uemail === mf.toLowerCase()) {
        // matched by email
      } else if (uname === mf.toLowerCase()) {
        // matched by name
      } else {
        return false;
      }
    }
    if (typeFilter && typeFilter !== 'all') {
      const key = activityKey(a);
      const candidate = String(typeFilter).toLowerCase();
      if (!key.includes(candidate) && !String(a.activityType?.id || '').toLowerCase().includes(candidate)) return false;
    }
    if (searchQuery && String(searchQuery).trim() !== '') {
      const q = String(searchQuery).toLowerCase();
      const hay = [
        a.notes || '',
        a.user?.name || '',
        activityKey(a),
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Sort
  const sortedActivities = searchedActivities.slice().sort((a, b) => {
    const ta = parseTimestamp(a.timestamp).getTime() || 0;
    const tb = parseTimestamp(b.timestamp).getTime() || 0;
    return sortOrder === 'newest' ? tb - ta : ta - tb;
  });

  // Pagination
  const totalItems = sortedActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const visibleActivities = sortedActivities.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  // Render activity list (clickable containers)
  const renderActivityList = () => (
    <div className="space-y-4 mt-8">
      {visibleActivities.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No activities found.</div>
      ) : (
        visibleActivities.map(activity => {
          const name = activity.activityType?.name?.toLowerCase() || '';
          let imgName = 'other-activity.png';
          if (name.includes('play')) imgName = 'play-activity.png';
          else if (name.includes('walk')) imgName = 'walk-activity.png';
          else if (name.includes('feed') || name.includes('food')) imgName = 'food-activity.png';
          else if (name.includes('water')) imgName = 'water-activity.png';
          else if (name.includes('groom')) imgName = 'grooming-activity.png';
          else if (name.includes('medicat')) imgName = 'medication-activity.png';
          else if (name.includes('chill')) imgName = 'chill-activity.png';
          const when = parseTimestamp(activity.timestamp);
          const heading = activity.activityType?.label || activity.activityType?.name || 'Activity';
          return (
            <div
              key={activity.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50 transition hover:bg-gray-100 cursor-pointer group flex items-start justify-between"
              onClick={() => setViewingActivity(activity)}
              style={{ cursor: 'pointer' }}
              tabIndex={0}
              role="button"
              aria-label={`View activity: ${heading}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setViewingActivity(activity); }}
            >
              <div className="flex items-center flex-1">
                <img src={`/${imgName}`} alt={heading} style={{ width: '56px', height: '40px', objectFit: 'contain', marginRight: '1.25rem', borderRadius: 0, boxShadow: 'none' }} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{heading}</p>
                  {activity.notes && <p className="text-gray-700 text-sm mt-1">{activity.notes}</p>}
                  {activity.user && <p className="text-xs text-gray-500 mt-2">by {activity.user.name}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <time className="text-sm text-gray-500 whitespace-nowrap">{when.toLocaleString()}</time>
                {/* View/Edit buttons hidden, container is now clickable */}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // Determine latest activity for display in header
  const latestActivity = (activities && activities.length > 0)
    ? activities.slice().sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp))[0]
    : null;

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



  // Only fetch if not provided as props (for deduplication)
  useEffect(() => {
    if (pet && activities) return;
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
    return () => {};
  }, [petId]);

  // Load favourites from server; fall back to localStorage
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (household?.id) {
          const serverActions = await apiFetch(`/api/households/${household.id}/favourites`);
          if (mounted && Array.isArray(serverActions)) {
            // normalize to { id, key, label, icon, data }
            setFavourites(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load favourites from server:', err.message || err);
      }

      // If server fetch fails or no household, set empty list (server-backed only)
      if (mounted) setFavourites([]);
    };
    load();
    return () => { mounted = false; };
  }, [household?.id]);

  // Listen for in-page activity events (dispatched by LogActivity or forwarded from socket)
  useEffect(() => {
    const handleNew = (e) => {
      try {
        const activity = e?.detail?.activity;
        if (!activity) return;
        const targetPetId = petId ? parseInt(petId) : null;
        const activityPetId = activity.petId || (activity.pet && activity.pet.id) || activity.pet?.id || null;
        if (targetPetId && activityPetId && parseInt(activityPetId) !== targetPetId) return;
        setActivities((prev = []) => {
          // replace if exists (normalize id to string), otherwise prepend
          const found = prev.some(a => String(a.id) === String(activity.id));
          if (found) return prev.map(a => String(a.id) === String(activity.id) ? activity : a);
          return [activity, ...prev];
        });
      } catch (err) {
        // ignore malformed events
      }
    };

    const handleUpdated = (e) => {
      try {
        const activity = e?.detail?.activity;
        if (!activity) return;
        const targetPetId = petId ? parseInt(petId) : null;
        const activityPetId = activity.petId || (activity.pet && activity.pet.id) || activity.pet?.id || null;
        if (targetPetId && activityPetId && parseInt(activityPetId) !== targetPetId) return;
        // If an editor is present, prefer showing editor as the 'user' for updated events so logs/notifications read correctly
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

    return () => {
      window.removeEventListener('petSitter:newActivity', handleNew);
      window.removeEventListener('petSitter:updatedActivity', handleUpdated);
      window.removeEventListener('petSitter:deletedActivity', handleDeleted);
    };
  }, [petId]);

  // Expose a loader so child components can refresh favourites after changes
  const loadFavourites = async () => {
    try {
      if (!household?.id) return;
      const serverActions = await apiFetch(`/api/households/${household.id}/favourites`);
      if (Array.isArray(serverActions)) {
        setFavourites(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
      }
    } catch (err) {
      console.warn('Failed to refresh favourites:', err);
    }
  };

  const createFavourite = async (action) => {
      // action: { key, label, icon, data }
    try {
      // Preferred flow: call server-side replay endpoint when action has an id and household is known
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
        // Use raw fetch so we can show server error details if the replay fails
        const token = localStorage.getItem('token');
        const replayUrl = apiUrl(`/api/households/${household.id}/favourites/${action.id}/replay`);
        console.log('Replay request', { replayUrl, householdId: household?.id, actionId: action?.id });
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

        console.log('Replay response', { status: resp.status, body });

        if (!resp.ok) {
          console.error('Replay error payload:', body);
          const msg = body?.error || (body?.message) || `HTTP ${resp.status}`;
          const details = body?.details ? `\n\n${body.details}` : '';
          alert(`Failed to apply Favourite: ${msg}${details}`);
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
        try {
          const serverActions = await apiFetch(`/api/households/${household.id}/favourites`);
          if (Array.isArray(serverActions)) setFavourites(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
        } catch (err) {
          // ignore
        }
        return;
      }

      // Non-server favourites are not supported anymore
      alert('This Favourite is not available. Favourites are server-backed only.');
    } catch (err) {
      console.error('Failed to create favourite activity', err);
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

  const handleDeleteFavourite = async (qa) => {
    try {
      if (!confirm('Delete this Favourite? This will remove the favourite but will NOT delete any previously logged activities.')) return;

      if (qa.id && household?.id) {
        const resp = await apiFetch(`/api/households/${household.id}/favourites/${qa.id}`, { method: 'DELETE' });
        console.log('Deleted favourite response', resp);
      } else {
        throw new Error('Cannot delete favourite: not a server-backed action');
      }

      // refresh list
      const serverActions = await apiFetch(`/api/households/${household.id}/favourites`);
      setFavourites(serverActions.map(a => ({ id: a.id, key: a.key, label: a.label, icon: a.icon, data: a.data || null })));
    } catch (err) {
      console.error('Failed to delete favourite', err);
      alert(err.message || 'Failed to delete favourite');
    }
  };

  const renderedFavourites = favourites || [];

  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

  const startEditingSection = (section) => {
    setEditingSection(section);
    if (section === 'general') {
      setEditValues({
        name: pet.name || '',
        species: pet.species,
        breed: pet.breed || '',
        dob: pet.dob || '',
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
        updateData.name = editValues.name || pet.name;
        updateData.species = editValues.species;
        updateData.breed = editValues.breed || null;
        updateData.dob = editValues.dob || null;
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
      // Add cache-busting param to photoUrl if present
      if (data && data.photoUrl) {
        data.photoUrl = data.photoUrl + (data.photoUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        console.log('New photoUrl set in state:', data.photoUrl);
      }
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
        <ThemeSpinner label="Loading pet details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="px-4 py-4">
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
        <header className="px-4 py-4">
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
    <div className="min-h-screen bg-white page-non-landing">
      <main className="flex flex-col items-stretch pb-6">
        {/* Full-bleed header band with grayscale bg image and overlay for consistency */}
        <div className="w-full" style={{ backgroundColor: '#f3f4f6', background: '#f3f4f6', color: '#111', zIndex: 2, position: 'relative' }}>
          <div style={{position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none'}}>
            <div style={{width: '100%', height: '100%', position: 'relative'}}>
              <div style={{width: '100%', height: '100%', backgroundImage: 'url(/hero-pets.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(1)'}} />
              <div style={{position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.45)'}} />
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-6 w-full relative" style={{zIndex: 1}}>
            <div className="mb-1 py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                {/* Avatar */}
                <div className="relative flex flex-col items-center">
                  <div className="w-28 h-28 md:w-40 md:h-40 rounded-2xl bg-gray-200 border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                    {pet.photoUrl ? (
                      <AvatarWithLoader src={resolvePhotoUrl(pet.photoUrl)} alt={pet.name} />
                    ) : (
                      <div className="text-gray-400 text-4xl">📷</div>
                    )}
                  </div>
                  <button
                    onClick={() => { if (isHouseholdMember) fileInputRef.current?.click(); }}
                    className={`absolute -bottom-3 -right-3 md:-bottom-2 md:-right-2 btn rounded-full w-9 h-9 md:w-12 md:h-12 flex items-center justify-center transition transform opacity-50 ${isHouseholdMember ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'} text-sm avatar-action z-20 ring-2 ring-white shadow`}
                    type="button"
                    aria-label="Change photo"
                    aria-disabled={!isHouseholdMember}
                    disabled={!isHouseholdMember}
                  >
                    +
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e)} className="hidden" />
                </div>
                {/* Main info and actions centered below avatar */}
                <div className="flex flex-col items-center w-full">
                  <h1 className="text-2xl md:text-4xl leading-tight text-center">
                    {pet ? (
                      <>
                        <span className="font-bold text-white">{pet.name}'s </span>
                        <span className="heading-light text-white" data-heading="Profile">Profile</span>
                      </>
                    ) : (
                      <span className="heading-light text-white" data-heading="Profile">Profile</span>
                    )}
                  </h1>
                  <div className="mt-2">
                    {latestActivity ? (
                      <div className="flex flex-row items-center gap-2 text-sm text-white">
                        <span>Latest Activity:</span>
                        <span className="inline-flex items-center gap-2 px-2 py-0.5 bg-gray-100 rounded-full text-sm">
                          {(() => {
                            const name = latestActivity.activityType?.name?.toLowerCase() || '';
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
                          <span className="text-sm font-medium text-gray-900">{(latestActivity.activityType?.name
                            ? `${latestActivity.activityType.name.charAt(0).toUpperCase()}${latestActivity.activityType.name.slice(1)}`
                            : 'Activity')}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-row items-center gap-2 text-sm text-white">
                        <span>Last Activity:</span>
                        <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-sm text-gray-200">No activities logged yet.</span>
                      </div>
                    )}
                  </div>
                  <blockquote className="italic max-w-lg text-lg md:text-xl leading-tight mt-4 text-center" style={{ fontFamily: `'Dancing Script', cursive`, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>
                    <span>“{getPetQuote(pet.name)}”</span>
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
                        if (household?.id) {
                          navigate(`/household/${household.id}/calendar`);
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
                      onClick={() => navigate(`/household/${pet?.householdId || householdId}/food-inventory`)}
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
                      aria-label="View Food Inventory"
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
              {/* Action buttons BELOW avatar and info removed (now only in header) */}
            </div>
          </div>
        </div>

        {/* Activity List removed from profile page; view full history on Activities tab */}
        <div className="mx-auto max-w-6xl px-6 w-full">
          {/* Activities are intentionally not shown on the pet profile. Use the "Activities" tab or the Activities page to view history. */}
        </div>

        {/* General Information Section */}
        <div style={{ marginBottom: '30px', paddingBottom: '30px' }} className="mx-auto max-w-6xl px-6 w-full border-b border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleSection('general')}
                aria-expanded={!collapsedSections.general}
                aria-label={collapsedSections.general ? 'Expand general section' : 'Collapse general section'}
                className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition focus:outline-none focus:ring-0 no-global-accent no-accent-hover"
              >
                <span className="text-sm">{collapsedSections.general ? '+' : '−'}</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">General Information</h2>
            </div>
            <div className="flex items-center gap-2">
              {editingSection === 'general' && (
                <>
                  <button
                    onClick={cancelEditingSection}
                    className="inline-flex items-center gap-2 btn btn-red font-semibold px-6 py-2 rounded-xl mr-1 cursor-pointer bg-[#C3001F]! text-white! border-0! hover:bg-[#ED1C24]!"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={savingSection}
                    className="btn font-semibold px-3 py-2 rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50 mr-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    {savingSection ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
              {editingSection !== 'general' && (
                <button
                  onClick={() => { if (isHouseholdMember) startEditingSection('general'); }}
                  disabled={!isHouseholdMember}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition no-global-accent no-accent-hover ${isHouseholdMember ? 'text-gray-600 hover:bg-gray-100 cursor-pointer' : 'text-gray-400 opacity-50 cursor-not-allowed'}`}
                  style={{ cursor: isHouseholdMember ? 'pointer' : 'not-allowed' }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {editingSection === 'general' ? (
            <div className="space-y-6 mt-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                <input
                  type="text"
                  value={editValues.name}
                  onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                  placeholder="Pet's name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                />
              </div>
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
                <div className="relative">
                  <input
                    type="text"
                    ref={breedInputRef}
                    value={editValues.breed}
                    onChange={e => updateBreedInput(e.target.value)}
                    onKeyDown={handleBreedKeyDown}
                    onFocus={() => {
                      if (breedsList.length && editValues.breed) updateBreedInput(editValues.breed);
                      else if (breedsList.length && !editValues.breed) {
                        setBreedSuggestions(breedsList.slice(0, 8));
                        setShowBreedSuggestions(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowBreedSuggestions(false), 150)}
                    placeholder="Start typing to find your breed..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                  />
                  {showBreedSuggestions && breedsList.length > 0 && (
                    <ul
                      role="listbox"
                      aria-label="Breed suggestions"
                      className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-gray-200 rounded shadow z-50"
                      ref={suggestionsRef}
                    >
                      {breedSuggestions.map((b, i) => {
                        const isFocused = i === focusedSuggestion;
                        return (
                          <li
                            id={`petdetail-breed-suggestion-${i}`}
                            key={b}
                            role="option"
                            aria-selected={isFocused}
                            className={`px-3 py-2 cursor-pointer text-sm ${isFocused ? 'btn' : 'hover:bg-gray-100'}`}
                            onMouseDown={ev => {
                              ev.preventDefault();
                              chooseBreed(b);
                            }}
                          >
                            {b}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>


              {/* Date of Birth, Age, and Weight */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={editValues.dob ? editValues.dob.slice(0, 10) : ''}
                    onChange={e => setEditValues({ ...editValues, dob: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Age</label>
                  <input
                    type="text"
                    value={editValues.dob ? getAgeFromDob(editValues.dob) : ''}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-700 focus:outline-none"
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
            </div>
          ) : (!collapsedSections.general && (
            <>
              <div className="space-y-6">
                {/* Name (read-only) */}
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-lg text-gray-900">{pet?.name || '-'}</p>
                </div>

                {/* Species */}
                <div>
                  <p className="text-sm text-gray-500">Species</p>
                  <p className="text-lg text-gray-900">{pet?.species ? (pet.species.charAt(0).toUpperCase() + pet.species.slice(1)) : '-'}</p>
                </div>

                {/* Breed */}
                <div>
                  <p className="text-sm text-gray-500">Breed</p>
                  <p className="text-lg text-gray-900">{pet?.breed || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="text-lg text-gray-900">{pet?.dob ? pet.dob.slice(0, 10) : '-'}</p>
                    <p className="text-sm text-gray-500 mt-2">Age</p>

                    <p className="text-lg text-gray-900">{pet?.dob ? getAgeFromDob(pet.dob) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="text-lg text-gray-900">{pet?.weight ? `${pet.weight} ${pet.weightUnit || 'lbs'}` : '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Siblings</p>
                  <p className="text-lg text-gray-900 flex flex-wrap gap-1">{siblingLinks.length > 0 ? siblingLinks : '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-lg text-gray-900 whitespace-pre-wrap wrap-break-word">{pet?.notes || '-'}</p>
                </div>
              </div>
            </>
          ))}
        </div>

        {/* Vet Information Section */}
        <div style={{ marginBottom: '30px', paddingBottom: '30px' }} className="mx-auto max-w-6xl px-6 w-full border-b border-gray-200 ">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => toggleSection('vet')}
                aria-expanded={!collapsedSections.vet}
                aria-label={collapsedSections.vet ? 'Expand vet section' : 'Collapse vet section'}
                className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition focus:outline-none focus:ring-0 no-global-accent no-accent-hover"
              >
                <span className="text-sm">{collapsedSections.vet ? '+' : '−'}</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Vet Information</h2>
            </div>
            <div className="flex items-center gap-2">
              {editingSection === 'vet' ? (
                <>
                  <button
                    onClick={cancelEditingSection}
                    className="inline-flex items-center gap-2 btn btn-red font-semibold px-6 py-2 rounded-xl mr-1 cursor-pointer bg-[#C3001F]! text-white! border-0! hover:bg-[#ED1C24]!"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={savingSection}
                    className="btn font-semibold px-3 py-2 rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50 mr-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    {savingSection ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { if (isHouseholdMember) startEditingSection('vet'); }}
                  disabled={!isHouseholdMember}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition no-global-accent no-accent-hover ${isHouseholdMember ? 'text-gray-600 hover:bg-gray-100 cursor-pointer' : 'text-gray-400 opacity-50 cursor-not-allowed'}`}
                  style={{ cursor: isHouseholdMember ? 'pointer' : 'not-allowed' }}
                >
                  Edit
                </button>
              )}
            </div>
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
            </div>
          ) : ( !collapsedSections.vet && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Veterinarian Name</p>
                <p className="text-lg text-gray-900">{pet.vetName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-lg text-gray-900">{pet.vetLocation || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="text-lg text-gray-900">{pet.vetContact || '-'}</p>
                {pet.vetContact && (
                  <a
                    href={`tel:${pet.vetContact}`}
                    className="mt-3 inline-flex items-center gap-2 btn btn-red font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
                    aria-label={`Call veterinarian at ${pet.vetContact} (Emergency)`}
                  >
                    <svg className="w-4 h-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M21 16.5v3a1.5 1.5 0 0 1-1.76 1.48c-2.13-.32-4.14-1.18-5.99-2.41a15.08 15.08 0 0 1-5.15-5.15C7.18 10.9 6.32 8.89 6 6.76A1.5 1.5 0 0 1 7.48 5H10.5a1.5 1.5 0 0 1 1.5 1.2c.12.82.39 1.62.8 2.35a1.5 1.5 0 0 1-.33 1.62l-1.2 1.2a11.99 11.99 0 0 0 5.15 5.15l1.2-1.2a1.5 1.5 0 0 1 1.62-.33c.73.41 1.53.68 2.35.8A1.5 1.5 0 0 1 21 16.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Call Vet Now (Emergency)</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Food Information Section */}
        <div style={{ marginBottom: '30px', paddingBottom: '30px' }} className="mx-auto max-w-6xl px-6 w-full border-b border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleSection('food')}
                aria-expanded={!collapsedSections.food}
                aria-label={collapsedSections.food ? 'Expand food section' : 'Collapse food section'}
                className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition focus:outline-none focus:ring-0 no-global-accent no-accent-hover"
              >
                <span className="text-sm">{collapsedSections.food ? '+' : '−'}</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Food Information</h2>
            </div>
            <div className="flex items-center gap-2">
              {editingSection === 'food' ? (
                <>
                  <button
                    onClick={cancelEditingSection}
                    className="inline-flex items-center gap-2 btn btn-red font-semibold px-6 py-2 rounded-xl mr-1 cursor-pointer bg-[#C3001F]! text-white! border-0! hover:bg-[#ED1C24]!"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={savingSection}
                    className="btn font-semibold px-3 py-2 rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50 mr-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    {savingSection ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { if (isHouseholdMember) navigate(`/household/${pet?.householdId || householdId}/food-inventory`); }}
                  disabled={!isHouseholdMember}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition no-global-accent no-accent-hover ${isHouseholdMember ? 'text-gray-600 hover:bg-gray-100 cursor-pointer' : 'text-gray-400 opacity-50 cursor-not-allowed'}`}
                  style={{ cursor: isHouseholdMember ? 'pointer' : 'not-allowed' }}
                >
                  Edit
                </button>
              )}
            </div>
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

            </div>
          ) : ( !collapsedSections.food && (
            <div>
              <p className="text-sm text-gray-500">Primary Food</p>
              <p className="text-lg text-gray-900">{pet.primaryFood || '-'}</p>
            </div>
          ))}
        </div>

       
      
      {showLogActivity && (
        <LogActivity
          petId={petId}
          household={household}
          pet={pet}
          activities={activities}
          disableInternalFetch={true}
          onActivityLogged={(newActivity) => {
            setActivities(prev => {
              // Always deduplicate by id
              const idStr = String(newActivity.id);
              const filtered = prev.filter(a => String(a.id) !== idStr);
              return [newActivity, ...filtered];
            });
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
            // Update the activity in the timeline (normalize id comparison)
            setActivities(prev => prev.map(a => String(a.id) === String(updatedActivity.id) ? updatedActivity : a));
            setEditingActivity(null);
          }}
          onActivityDeleted={(activityId) => {
            // Remove the activity from the timeline (normalize id comparison)
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
          onDelete={(id) => { setViewingActivity(null); handleDeleteActivity(id); }}
        />
      )}
    
      </main>
    </div>
  );
}