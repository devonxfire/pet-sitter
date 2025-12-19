import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, API_BASE, apiUrl } from './api';


import LogActivity from './LogActivity';
import ActivityView from './ActivityView';
import ACTIVITY_TYPES from './activityTypes';
import { Link } from 'react-router-dom';



// ...existing code...


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

  // Show all other pets in the same household as siblings, as clickable links
  const siblingLinks = (pet && household && Array.isArray(household.pets))
    ? household.pets.filter(p => String(p.id) !== String(pet.id)).map(s =>
        s && s.name ? (
          <Link
            key={s.id}
            to={`/pet/${s.id}`}
            className="text-accent hover:underline cursor-pointer mr-2"
          >
            {s.name}
          </Link>
        ) : null
      ).filter(Boolean)
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

  // Small helper: generate a short, pet-specific quote using templates.
  // This is deterministic and offline — no external API calls required.
  const getPetQuote = (name) => {
    const n = name || 'Your pet';
    const templates = [
      `${n} is the little miracle that makes every day brighter.`,
      `Home is where ${n} greets you with a wag and a smile.`,
      `${n} fills ordinary moments with extraordinary love.`,
      `Life is better with ${n} by your side.`,
      `${n} teaches the heart how to be gentle again.`
    ];
    // pick a pseudo-random template based on name so it feels consistent
    let sum = 0;
    for (let i = 0; i < n.length; i++) sum += n.charCodeAt(i);
    return templates[sum % templates.length];
  };

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
        <header className="px-4 py-4">
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
              <div className="grid md:grid-flow-col md:auto-cols-max items-start gap-2 md:gap-2">

            {/* Avatar */}
            <div className="shrink-0 flex flex-col items-center md:items-start -ml-3 md:ml-0">
              <div className="relative">
                <div className="w-28 h-28 md:w-40 md:h-40 rounded-2xl bg-gray-200 border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {pet.photoUrl ? (
                    <img src={resolvePhotoUrl(pet.photoUrl)} alt={pet.name} className="w-full h-full object-cover select-none" draggable={false} />
                  ) : (
                    <div className="text-gray-400 text-4xl">📷</div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-3 -right-3 md:-bottom-2 md:-right-2 btn rounded-full w-9 h-9 md:w-12 md:h-12 flex items-center justify-center cursor-pointer transition transform hover:scale-105 text-sm avatar-action z-20 ring-2 ring-white shadow"
                  type="button"
                  aria-label="Change photo"
                >
                  +
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e)} className="hidden" />
              </div>
            </div>

            {/* Main info */}
              <div className="min-w-0 flex-1 h-28 md:h-40 flex flex-col justify-between items-start ml-3 md:ml-5">
              <div className="flex flex-col justify-between h-full ">
                <div>
                  <div className="flex items-baseline gap-3">
                      <h1 className="text-2xl md:text-4xl leading-tight">
                        {pet ? (
                          <>
                            <span className="font-bold text-white">{pet.name}'s </span>
                            <span className="heading-light text-white" data-heading="Profile">Profile</span>
                          </>
                        ) : (
                          <span className="heading-light text-white" data-heading="Profile">Profile</span>
                        )}
                    </h1>
                    {/* single edit control is shown in the General Information section below */}
                  </div>

                  <div className="mt-1">
                    <div className="inline-block align-top">
                      {latestActivity ? (
                        <div className="flex items-center gap-3 text-sm text-white">
                          <span className="">Latest Activity:</span>
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
                        <div className="flex items-center gap-3 text-sm text-white">
                          <span>Last Activity:</span>
                          <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-sm text-gray-200">No activities logged yet.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row items-center gap-6 mt-3">
                  <div className="flex flex-row gap-3">
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
                      onClick={() => navigate(`/pet/${petId}/calendar`)}
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
                  </div>
                  <blockquote className="italic max-w-lg text-lg md:text-xl leading-tight ml-6" style={{ fontFamily: `'Dancing Script', cursive`, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>
                    <span>“{getPetQuote(pet.name)}”</span>
                  </blockquote>
                </div>
              </div>
            </div>

            {/* Actions moved inline with Age value */}
              </div>
              {/* Right-side pet quote removed (moved into header grid) */}
            </div>
            {/* Action buttons BELOW avatar and info removed (now only in header) */}
          </div>
        </div>



        {/* Notes block removed (now shown in header) */}

        {/* Activities moved to their own page. */}
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
                  onClick={() => startEditingSection('general')}
                  className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium transition no-global-accent no-accent-hover cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {editingSection === 'general' ? (
            <div className="space-y-6 mt-6">
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
            </div>
          ) : (!collapsedSections.general && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Species</p>
                <p className="text-lg text-gray-900">{pet?.species ? (pet.species.charAt(0).toUpperCase() + pet.species.slice(1)) : '-'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Breed</p>
                <p className="text-lg text-gray-900">{pet?.breed || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="text-lg text-gray-900">{pet?.age ? `${pet.age} years` : '-'}</p>
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
          ))}
        </div>

        {/* Vet Information Section */}
        {(pet.vetName || pet.vetLocation || pet.vetContact) && (
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
                    onClick={() => startEditingSection('vet')}
                    className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium transition no-global-accent no-accent-hover cursor-pointer"
                    style={{ cursor: 'pointer' }}
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
                      className="mt-3 inline-flex items-center gap-2 btn btn-red font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition"
                      aria-label={`Call veterinarian at ${pet.vetContact} (Emergency)`}
                    >
                      <svg className="w-4 h-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M21 16.5v3a1.5 1.5 0 0 1-1.76 1.48c-2.13-.32-4.14-1.18-5.99-2.41a15.08 15.08 0 0 1-5.15-5.15C7.18 10.9 6.32 8.89 6 6.76A1.5 1.5 0 0 1 7.48 5H10.5a1.5 1.5 0 0 1 1.5 1.2c.12.82.39 1.62.8 2.35a1.5 1.5 0 0 1-.33 1.62l-1.2 1.2a11.99 11.99 0 0 0 5.15 5.15l1.2-1.2a1.5 1.5 0 0 1 1.62-.33c.73.41 1.53.68 2.35.8A1.5 1.5 0 0 1 21 16.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Call Vet Now (Emergency)</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Food Information Section */}
        {pet.primaryFood && (
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
                    onClick={() => startEditingSection('food')}
                    className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium transition no-global-accent no-accent-hover cursor-pointer"
                    style={{ cursor: 'pointer' }}
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
                <p className="text-lg text-gray-900">{pet.primaryFood}</p>
              </div>
            ))}
          </div>
        )}

       
      
      {showLogActivity && (
        <LogActivity
          petId={petId}
          household={household}
          onActivityLogged={(newActivity) => {
            setActivities(prev => {
              const existingIds = new Set(prev.map(a => String(a.id)));
              if (existingIds.has(String(newActivity.id))) {
                // replace existing entry with fresh data
                return prev.map(a => String(a.id) === String(newActivity.id) ? newActivity : a);
              }
              return [newActivity, ...prev];
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