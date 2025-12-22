import React, { useState } from 'react';
import { apiFetch, apiUrl } from './api';
import ACTIVITY_TYPES from './activityTypes';
import { theme } from './theme';
import ModalClose from './ModalClose';

export default function LogActivity({ petId, household, user, activity, onActivityLogged, onActivityDeleted, onClose, onFavouritesUpdated, step, setStep }) {
    // ...existing code...
  // Ref for the date/time input (for schedule activity slide)
  const dateTimeInputRef = React.useRef(null);
  // Style override for reminder toggle background color
  // This must be at the top level so it is not shadowed by the button element
  // and will apply globally to the toggle
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .reminder-toggle-on { background: #10B981 !important; }
      .reminder-toggle-off { background: #EF4444 !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  console.log('[LogActivity] Render (mounting)', { activity, petId, household, step });

  // If an activity prop is present we are editing; allow `step` to be controlled
  // by parent or fall back to internal state which defaults to 'edit' for edits
  const isEditing = !!activity;
  const [internalStep, setInternalStep] = useState(step || (isEditing ? 'details' : 'selectType'));
  const currentStep = (typeof step === 'string') ? step : internalStep;
  const setStepLocal = (typeof setStep === 'function') ? setStep : setInternalStep;

  const [selectedType, setSelectedType] = useState(activity?.activityType?.name || '');
  const [timing, setTiming] = useState(activity ? (new Date(activity.timestamp) > new Date() ? 'upcoming' : 'happened') : ''); // 'happened' or 'upcoming'
  const [notes, setNotes] = useState(activity?.notes || '');
  const [photoFile, setPhotoFile] = useState(null);
  // Initialize preview from existing activity photo when editing
  const initialPhotoPreview = activity && (activity.photoUrl || activity.data?.photoUrl || activity.photo)
    ? (activity.photoUrl && activity.photoUrl.startsWith('http') ? activity.photoUrl : apiUrl(activity.photoUrl || activity.data?.photoUrl || activity.photo))
    : null;
  const [photoPreview, setPhotoPreview] = useState(initialPhotoPreview);
  const photoInputRef = React.useRef(null);

  // When editing, start in the multi-step flow so users can navigate through slides
  React.useEffect(() => {
    if (isEditing && currentStep === 'edit') {
      setStepLocal('details');
    }
  }, [isEditing, currentStep]);

  // Helper to format a Date into a `datetime-local` input value in local time
  const toLocalInputValue = (date) => {
    if (!(date instanceof Date)) date = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [timestamp, setTimestamp] = useState(
    activity ? toLocalInputValue(new Date(activity.timestamp)) : toLocalInputValue(new Date())
  );
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('30'); // minutes before
  const [reminderMethod, setReminderMethod] = useState('email'); // 'email' or 'google'
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [addToFavourites, setAddToFavourites] = useState(false);

  const handleScheduleSubmit = () => {
    console.log('[LogActivity] handleScheduleSubmit', { timing, step: currentStep });
    if (timing === 'upcoming') {
      setStepLocal('reminder');
      console.log('[LogActivity] Set step to reminder');
    } else {
      setStepLocal('details');
      console.log('[LogActivity] Set step to details');
    }
  };

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setStepLocal('timing');
    console.log('[LogActivity] handleTypeSelect', { typeId, step: currentStep });
  };

  const [, forceRerender] = useState(0);
  const handleTimingSelect = (timingChoice) => {
    console.log('[LogActivity] handleTimingSelect', { timingChoice, step: currentStep });
    setTiming(timingChoice);
    if (timingChoice === 'happened') {
      setTimestamp(toLocalInputValue(new Date()));
      setStepLocal('happened');
      console.log('[LogActivity] Set step to happened');
    } else {
      setStepLocal('schedule');
      console.log('[LogActivity] Set step to schedule');
      setTimeout(() => forceRerender(n => n + 1), 0);
    }
  };

  const handleHappenedSubmit = () => {
    setStepLocal('details');
  };

  const handleReminderSubmit = () => {
    console.log('[LogActivity] handleReminderSubmit called');
    setStepLocal('details');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Debug: log timestamp values
    console.log('[LogActivity] Raw timestamp input:', timestamp);
    try {
      const iso = new Date(timestamp).toISOString();
      console.log('[LogActivity] Converted to ISO:', iso);
    } catch (err) {
      console.warn('[LogActivity] Error converting timestamp to ISO:', err);
    }

    try {
      // derive client-side type info so we can label notifications immediately
      const typeDef = ACTIVITY_TYPES.find(t => t.id === selectedType) || {};

      if (isEditing) {
        // PATCH the original activity, POST new activities for other selected pets
        let photoUrlForThis = null;
        try {
          if (photoFile) {
            const formData = new FormData();
            formData.append('photo', photoFile);
            const token = localStorage.getItem('token');
            const pid = activity.petId || activity.pet?.id || (selectedPetIds && selectedPetIds[0]) || petId;
            const uploadRes = await fetch(apiUrl(`/api/pets/${pid}/activities/photo`), {
              method: 'POST',
              body: formData,
              headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });
            if (uploadRes.ok) {
              const uploadJson = await uploadRes.json().catch(() => null);
              photoUrlForThis = uploadJson && (uploadJson.photoPath || uploadJson.photoUrl) ? (uploadJson.photoPath || uploadJson.photoUrl) : null;
            } else {
              console.warn('Photo upload failed when editing activity', uploadRes.status);
            }
          }
        } catch (err) {
          console.warn('Failed to upload photo while editing', err);
        }

        const patchPayload = {
          timestamp: new Date(timestamp).toISOString(),
          notes: notes || null
        };
        if (selectedType) patchPayload.activityTypeId = selectedType;
        if (photoUrlForThis) patchPayload.photoUrl = photoUrlForThis;

        // PATCH the original activity
        const data = await apiFetch(`/api/activities/${activity.id}`, {
          method: 'PATCH',
          body: JSON.stringify(patchPayload)
        });
        const augmented = { ...data, _clientActionLabel: (data.activityType?.label || data.activityType?.name || typeDef.label || selectedType), _updatedActivity: true };
        try {
          if (!augmented.editedBy && user) {
            augmented.editedBy = { id: user.id, name: user.name || ((user.firstName || '') + ' ' + (user.lastName || '')).trim() };
          }
        } catch (e) {}
        if (typeof onActivityLogged === 'function') onActivityLogged(augmented);
        try { window.dispatchEvent(new CustomEvent('petSitter:updatedActivity', { detail: { activity: augmented } })); } catch (e) {}
        try {
          const payload = { householdId: household?.id, activity: augmented, ts: Date.now() };
          localStorage.setItem('petSitter:latestActivity', JSON.stringify(payload));
        } catch (e) {}

        // POST new activities for other selected pets
        const originalPetId = activity.petId || activity.pet?.id || petId;
        const otherPetIds = Array.from(new Set(selectedPetIds.map(id => parseInt(id)))).filter(pid => pid !== originalPetId);
        if (otherPetIds.length > 0) {
          const promises = otherPetIds.map(async (pid) => {
            let photoUrlForThisOther = photoUrlForThis;
            // Optionally upload photo for each pet (skip for now, reuse)
            const payload = {
              activityTypeId: selectedType,
              timestamp: new Date(timestamp).toISOString(),
              notes: notes || null,
              data: { petNames: pets.filter(p => selectedPetIds.includes(p.id)).map(p => p.name) }
            };
            if (photoUrlForThisOther) payload.photoUrl = photoUrlForThisOther;
            return apiFetch(`/api/pets/${pid}/activities`, {
              method: 'POST',
              body: JSON.stringify(payload)
            });
          });
          const results = await Promise.all(promises);
          results.forEach((res) => {
            const clientLabel = typeDef.label || selectedType;
            const augmentedOther = { ...res, _clientActionLabel: clientLabel };
            try { if (!augmentedOther.user && user) augmentedOther.user = user; } catch (e) {}
            try { if (typeof onActivityLogged === 'function') onActivityLogged(augmentedOther); } catch (e) {}
            try { window.dispatchEvent(new CustomEvent('petSitter:newActivity', { detail: { activity: augmentedOther } })); } catch (e) {}
            try {
              const payload = { householdId: household?.id, activity: augmentedOther, ts: Date.now() };
              localStorage.setItem('petSitter:latestActivity', JSON.stringify(payload));
            } catch (e) {}
          });
        }
      } else {
        // Create new activity(s) for selected pet(s)
        // Deduplicate pet IDs to avoid double-logging
        const petIdsToSend = (selectedPetIds && selectedPetIds.length > 0)
          ? Array.from(new Set(selectedPetIds.map(id => parseInt(id))))
          : (petId ? [parseInt(petId)] : []);
        if (petIdsToSend.length === 0) {
          throw new Error('Please select at least one pet to apply this activity to.');
        }

        const promises = petIdsToSend.map(async (pid) => {
          let photoUrlForThis = null;
          if (photoFile) {
            try {
              const formData = new FormData();
              formData.append('photo', photoFile);
              // Use direct fetch so browser sets multipart boundaries correctly
              const token = localStorage.getItem('token');
              const uploadRes = await fetch(apiUrl(`/api/pets/${pid}/activities/photo`), {
                method: 'POST',
                body: formData,
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
              });
              const actualUploadUrl = apiUrl(`/api/pets/${pid}/activities/photo`);
              console.log('[LogActivity] Uploading photo to', actualUploadUrl, { pid, fileName: formData.get('photo')?.name });
              if (!uploadRes.ok) {
                const txt = await uploadRes.text().catch(() => null);
                console.warn('[LogActivity] Photo upload failed for pet', pid, uploadRes.status, txt);
              } else {
                const uploadJson = await uploadRes.json().catch(() => null);
                // Confirm the response came from the activity upload endpoint
                const finalUrl = (uploadRes && uploadRes.url) || '';
                const cameFromActivityEndpoint = finalUrl.includes('/activities/photo');
                if (!cameFromActivityEndpoint) {
                  console.warn('[LogActivity] Photo upload returned from unexpected endpoint', finalUrl, '— ignoring as activity photo to avoid updating pet avatar. Response:', uploadJson);
                } else {
                  // Accept either { photoPath } (activity upload) or { photoUrl }
                  photoUrlForThis = (uploadJson && (uploadJson.photoPath || uploadJson.photoUrl)) || null;
                  console.log('[LogActivity] Photo upload response for pet', pid, uploadRes.status, uploadJson, ' -> using', photoUrlForThis);
                }
              }
            } catch (err) {
              console.warn('[LogActivity] Photo upload error for pet', pid, err);
            }
          }

          const payload = {
            activityTypeId: selectedType,
            timestamp: new Date(timestamp).toISOString(),
            notes: notes || null,
            data: { petNames: pets.filter(p => petIdsToSend.includes(p.id)).map(p => p.name) }
          };
          if (photoUrlForThis) payload.photoUrl = photoUrlForThis;
          console.log('[LogActivity] POST payload for pet', pid, payload);
          return apiFetch(`/api/pets/${pid}/activities`, {
            method: 'POST',
            body: JSON.stringify(payload)
          });
        });

        const results = await Promise.all(promises);
        results.forEach((res) => {
          // augment with client-side action label so notifications display correctly immediately
          const clientLabel = typeDef.label || selectedType;
          const augmented = { ...res, _clientActionLabel: clientLabel };
          try { if (!augmented.user && user) augmented.user = user; } catch (e) {}
          // Only dispatch event, do not call onActivityLogged directly (prevents duplicate)
          try { window.dispatchEvent(new CustomEvent('petSitter:newActivity', { detail: { activity: augmented } })); } catch (e) {}
          try {
            const payload = { householdId: household?.id, activity: augmented, ts: Date.now() };
            localStorage.setItem('petSitter:latestActivity', JSON.stringify(payload));
          } catch (e) {}
        });

        // Optionally save as a server-backed Favourite
        if (addToFavourites && selectedType) {
          if (household?.id) {
            const typeDef = ACTIVITY_TYPES.find(t => t.id === selectedType) || {};
            const snapshot = {
              key: selectedType,
              label: typeDef.label || selectedType,
              icon: typeDef.icon || null,
              data: { petIds: selectedPetIds, applyToAll: allSelected, notes: notes || '', data: {} }
            };
            try {
              await apiFetch(`/api/households/${household.id}/favourites`, {
                method: 'POST',
                body: JSON.stringify(snapshot)
              });
              try { if (typeof onFavouritesUpdated === 'function') await onFavouritesUpdated(); } catch (e) { console.warn('onFavouritesUpdated callback failed', e); }
            } catch (err) {
              console.error('Failed to save favourite to server', err);
            }
          } else {
            console.warn('No household context; Favourites require server-backed household. Skipping save.');
          }
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to save activity', err);
      setError(err.message || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const url = URL.createObjectURL(f);
      setPhotoFile(f);
      setPhotoPreview(url);
    } catch (err) {
      console.warn('Failed to create photo preview', err);
    }
  };

  const triggerPhotoInput = () => {
    if (photoInputRef.current) photoInputRef.current.click();
  };

  const removePhoto = () => {
    if (photoPreview) {
      try { URL.revokeObjectURL(photoPreview); } catch (e) {}
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = null;
  };

  React.useEffect(() => {
    return () => {
      if (photoPreview) {
        try { URL.revokeObjectURL(photoPreview); } catch (e) {}
      }
    };
  }, [photoPreview]);

  const handleDelete = async () => {
    if (!activity) return;
    if (!window.confirm('Are you sure you want to delete this activity?')) return;

    setError('');
    setDeleting(true);

    try {
      await apiFetch(`/api/activities/${activity.id}`, { method: 'DELETE' });
      console.log('✅ Activity deleted');
      if (typeof onActivityDeleted === 'function') onActivityDeleted(activity.id);
      else if (typeof onActivityLogged === 'function') onActivityLogged(null);
      onClose();
          try { window.dispatchEvent(new CustomEvent('petSitter:deletedActivity', { detail: { activityId: activity.id } })); } catch (e) {}
          try {
            localStorage.setItem('petSitter:deletedActivity', JSON.stringify({ householdId: household?.id, activityId: activity.id, ts: Date.now() }));
          } catch (e) {}
    } catch (err) {
      console.error('Failed to delete activity', err);
      setError(err.message || 'Failed to delete activity');
      setDeleting(false);
    }
  };
  const selectedActivity = ACTIVITY_TYPES.find(t => t.id === selectedType);
  const [pets, setPets] = useState([]);
  // normalize to numbers so comparisons and paras work reliably
  // Always deduplicate and avoid double-inclusion of current pet
  const initialPetIds = activity
    ? [parseInt(activity.petId || activity.pet?.id || petId)]
    : (petId ? [parseInt(petId)] : []);
  const [selectedPetIds, setSelectedPetIds] = useState(Array.from(new Set(initialPetIds)));

  const allSelected = pets.length > 0 && selectedPetIds.length === pets.length;

  // Fetch household pets if provided (always register hook at top-level)
  React.useEffect(() => {
    let mounted = true;
    async function loadPets() {
      if (household?.id) {
        try {
          const data = await apiFetch(`/api/households/${household.id}/pets`);
          if (!mounted) return;
          setPets(data || []);
          // If no selectedPetIds yet, default to the current pet page (as a number), deduplicated
          setSelectedPetIds((current) => {
            if (current && current.length > 0) return Array.from(new Set(current));
            return petId ? [parseInt(petId)] : [];
          });
        } catch (err) {
          console.error('Failed to load household pets:', err);
        }
      } else {
        // No household provided; ensure current petId is selected
        if (petId) setSelectedPetIds([parseInt(petId)]);
      }
    }
    loadPets();
    return () => { mounted = false; };
  }, [household?.id, petId]);

  // Step 1: Select Activity Type
  const [hoveredType, setHoveredType] = React.useState(null);
  if (currentStep === 'selectType') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 relative animate-fade-in" style={{padding: '2.5rem 2.5rem 2.5rem 2.5rem', minWidth: '700px'}}>
          <ModalClose onClick={onClose} className="absolute top-3 right-3 text-2xl font-bold focus:outline-none cursor-pointer" />
          <div className="flex flex-row items-center mb-6 justify-center w-full">
            <div className="flex flex-col items-center w-full">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center w-full">Select Activity Type</h2>
            </div>
          </div>
          {/* Force white background for activity type cards in this modal only */}
          <style>{`
            .activity-type-card-fix {
              background: #fff !important;
              background-color: #fff !important;
              border-radius: 0.75rem !important;
              position: relative;
              overflow: visible;
            }
            .activity-type-card-fix::after {
              content: '';
              display: block;
              position: absolute;
              left: 0;
              right: 0;
              bottom: 0;
              height: 0;
              border-bottom-left-radius: 0.75rem;
              border-bottom-right-radius: 0.75rem;
              background: transparent;
              pointer-events: none;
              transition: height 0.18s, background 0.18s;
              z-index: 2;
            }
            /* Show red border by default ONLY if Feeding and nothing is selected and no other card is hovered */
            .activity-type-card-fix.feeding-default::after {
              height: 4px;
              background: #C3001F;
              border-bottom-left-radius: 0.75rem;
              border-bottom-right-radius: 0.75rem;
            }
            /* Show red border on hover ONLY if a type is selected (no feeding-default) */
            .activity-type-card-fix:not(.feeding-default):hover::after {
              height: 4px;
              background: #C3001F;
              border-bottom-left-radius: 0.75rem;
              border-bottom-right-radius: 0.75rem;
            }
            /* Hide feeding-default border if any card is hovered */
            .activity-type-card-fix.feeding-default.hide-default::after {
              height: 0 !important;
              background: transparent !important;
            }
          `}</style>
          <div className="grid grid-cols-4 gap-5">
            {ACTIVITY_TYPES.map((type) => {
              // Map special cases for image names
              let imgName = (type.name || type.id || '').toLowerCase().replace(/\s+/g, '-') + '-activity.png';
              if (type.id === 'feeding') imgName = 'food-activity.png';
              if (type.id === 'chilling') imgName = 'chill-activity.png';
              // Add feeding-default class if this is the Feeding card and no type is selected yet and no other card is hovered
              const isFeedingDefault = type.id === 'feeding' && !selectedType && !hoveredType;
              // Hide feeding-default border if any card is hovered (except itself)
              const hideFeedingDefault = type.id === 'feeding' && !selectedType && hoveredType && hoveredType !== 'feeding';
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  onMouseEnter={() => setHoveredType(type.id)}
                  onMouseLeave={() => setHoveredType(null)}
                  className={
                    `py-8 px-4 rounded-xl flex flex-col items-center gap-2 border border-gray-200 shadow-2xl transition-all duration-150 focus:outline-none activity-type-card-fix cursor-pointer` +
                    (isFeedingDefault ? ' feeding-default' : '') +
                    (hideFeedingDefault ? ' hide-default' : '')
                  }
                  style={{ boxShadow: '0 12px 48px 0 rgba(0,0,0,0.28)' }}
                >
                  <img src={`/${imgName}`} alt={type.label} style={{ width: '90px', height: '60px', objectFit: 'contain', marginBottom: '0.5rem', borderRadius: 0, boxShadow: 'none' }} />
                  <span className="text-base font-medium text-gray-500 text-center">
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  
  }

  // Step 2: Timing - Happened or Upcoming
  if (currentStep === 'timing') {
    console.log('[LogActivity] Rendering timing step', { step: currentStep, timing });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2.5rem 2.5rem 2.5rem'}}>
          <ModalClose onClick={onClose} className="absolute top-3 right-3 text-2xl font-bold focus:outline-none" />
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">When?</h2>
            {(() => {
              let imgName = ((selectedActivity?.name || selectedActivity?.id || '').toLowerCase().replace(/\s+/g, '-') + '-activity.png');
              if (selectedActivity?.id === 'feeding') imgName = 'food-activity.png';
              if (selectedActivity?.id === 'chilling') imgName = 'chill-activity.png';
              return <img src={`/${imgName}`} alt={selectedActivity?.label} style={{ width: '192px', maxWidth: '100%', height: 'auto', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />;
            })()}
            <p className="text-xl font-semibold text-gray-900 mt-2">{selectedActivity?.label}</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => handleTimingSelect('happened')}
              className="w-full py-6 px-6 rounded-xl border border-gray-200 text-left focus:outline-none activity-type-card-fix cursor-pointer"
              style={{}}
            >
              <div className="font-semibold text-lg text-gray-900">Already Happened</div>
              <div className="text-sm text-gray-500">Log a past activity</div>
            </button>
            <button
              onClick={() => handleTimingSelect('upcoming')}
              className="w-full py-6 px-6 rounded-xl border border-gray-200 text-left focus:outline-none activity-type-card-fix cursor-pointer"
              style={{}}
            >
              <div className="font-semibold text-lg text-gray-900">Upcoming</div>
              <div className="text-sm text-gray-500">Schedule for later</div>
            </button>
          </div>
          <button
            onClick={() => setStepLocal('selectType')}
            className="mt-6 w-full py-3 text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Step 3b: Schedule (for upcoming)
  if (currentStep === 'schedule') {
    console.log('[LogActivity] Rendering schedule step', { step: currentStep, timing });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2.5rem 2.5rem 2.5rem'}}>
          <ModalClose onClick={onClose} className="absolute top-3 right-3 text-2xl font-bold focus:outline-none" />
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Schedule Activity</h2>
            {(() => {
              let imgName = ((selectedActivity?.name || selectedActivity?.id || '').toLowerCase().replace(/\s+/g, '-') + '-activity.png');
              if (selectedActivity?.id === 'feeding') imgName = 'food-activity.png';
              if (selectedActivity?.id === 'chilling') imgName = 'chill-activity.png';
              return <img src={`/${imgName}`} alt={selectedActivity?.label} style={{ width: '192px', maxWidth: '100%', height: 'auto', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />;
            })()}
            <p className="text-xl font-semibold text-gray-900 mt-2">{selectedActivity?.label}</p>
          </div>
          <div
            className="mb-6 cursor-pointer group"
            onClick={() => dateTimeInputRef.current && dateTimeInputRef.current.showPicker ? dateTimeInputRef.current.showPicker() : dateTimeInputRef.current && dateTimeInputRef.current.focus()}
            tabIndex={0}
            role="button"
            style={{ userSelect: 'none' }}
          >
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Date & Time
            </label>
            <input
              ref={dateTimeInputRef}
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-accent focus:outline-none text-lg schedule-cursor-pointer"
              style={{ cursor: 'pointer' }}
              tabIndex={-1}
            />
            <p className="text-sm text-gray-500 mt-2">Pick a future date and time</p>
            <style>{`
              .schedule-cursor-pointer, .schedule-cursor-pointer::-webkit-calendar-picker-indicator {
                cursor: pointer !important;
              }
            `}</style>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStepLocal('timing')}
              className="flex-1 py-3 bg-white text-gray-900 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={handleScheduleSubmit}
              className="flex-1 py-3 bg-accent text-gray-900 font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3a: When it Happened
  if (currentStep === 'happened') {
    console.log('[LogActivity] Rendering happened step', { step: currentStep, timing });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2.5rem 2.5rem 2.5rem'}}>
          <ModalClose onClick={onClose} className="absolute top-3 right-3 text-2xl font-bold focus:outline-none" />
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">When did it happen?</h2>
            {(() => {
              let imgName = ((selectedActivity?.name || selectedActivity?.id || '').toLowerCase().replace(/\s+/g, '-') + '-activity.png');
              if (selectedActivity?.id === 'feeding') imgName = 'food-activity.png';
              if (selectedActivity?.id === 'chilling') imgName = 'chill-activity.png';
              return <img src={`/${imgName}`} alt={selectedActivity?.label} style={{ width: '192px', maxWidth: '100%', height: 'auto', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />;
            })()}
            <p className="text-xl font-semibold text-gray-900 mt-2">{selectedActivity?.label}</p>
          </div>
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-accent focus:outline-none text-lg"
            />
            <p className="text-sm text-gray-500 mt-2">Defaults to current time</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStepLocal('timing')}
              className="flex-1 py-3 bg-white text-gray-900 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={handleHappenedSubmit}
              className="flex-1 py-3 bg-accent text-gray-900 font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Reminder Setup (if upcoming)
  if (currentStep === 'reminder') {
    console.log('[LogActivity] Rendering reminder step', { step: currentStep, timing });
    console.log('[LogActivity] Rendering reminder step');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
          <ModalClose onClick={onClose} className="absolute top-3 right-3 text-2xl font-bold focus:outline-none" />
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Set Reminder?</h2>
          </div>
          <div className="text-center mb-8 flex flex-col items-center justify-center">
            {(() => {
              let imgName = ((selectedActivity?.name || selectedActivity?.id || '').toLowerCase().replace(/\s+/g, '-') + '-activity.png');
              if (selectedActivity?.id === 'feeding') imgName = 'food-activity.png';
              if (selectedActivity?.id === 'chilling') imgName = 'chill-activity.png';
              return <img src={`/${imgName}`} alt={selectedActivity?.label} style={{ width: '192px', maxWidth: '100%', height: 'auto', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />;
            })()}
            <p className="text-xl font-semibold text-gray-900 mt-4">{selectedActivity?.label}</p>
          </div>

          {/* Show attached photo preview in Summary if user added one (or existing activity has a photo) */}
          {(photoPreview || (activity && activity.photoUrl)) && (
            <div className="mb-6 flex items-center justify-center">
              <div className="w-40 h-28 rounded-md overflow-hidden border border-gray-200">
                <img
                  src={photoPreview || (activity.photoUrl && (activity.photoUrl.startsWith('http') ? activity.photoUrl : apiUrl(activity.photoUrl)))}
                  alt="Activity photo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          {/* Notes only on Details slide; photo moved to its own slide */}

          <div>
            <label className="block text-lg font-medium text-gray-900 mb-3">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Add notes about this activity (optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none" />
          </div>
          <div className="space-y-6">
            {/* Enable Reminder Toggle */}
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">Enable Reminder</p>
                <p className="text-sm text-gray-500">Get notified before this activity</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${reminderEnabled ? 'text-green-600' : 'text-red-600'}`}>{reminderEnabled ? 'ON' : 'OFF'}</span>
                <button
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`reminder-toggle-btn ${reminderEnabled ? 'on' : 'off'} relative inline-flex h-8 w-16 items-center rounded-full transition`}
                  style={{
                    boxShadow: 'none',
                    border: 'none',
                    outline: 'none',
                    backgroundImage: 'none',
                  }}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${reminderEnabled ? 'translate-x-9' : 'translate-x-1'}`}
                  />
                </button>
              </div>
                  {/* Place style block at the end of the component to guarantee override */}
                  <style>{`
                    .reminder-toggle-btn.on { background: #10B981 !important; }
                    .reminder-toggle-btn.off { background: #EF4444 !important; }
                  `}</style>
            </div>
            {reminderEnabled && (
              <>
                {/* Reminder Time */}
                <div>
                  <label className="block text-lg font-medium text-gray-900 mb-3">
                    Send reminder before
                  </label>
                  <select
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-accent focus:outline-none"
                  >
                    <option value="5">5 minutes before</option>
                    <option value="15">15 minutes before</option>
                    <option value="30">30 minutes before</option>
                    <option value="60">1 hour before</option>
                    <option value="120">2 hours before</option>
                    <option value="1440">1 day before</option>
                  </select>
                </div>
                {/* Add to Google Calendar */}
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Add to Google Calendar</p>
                    <p className="text-sm text-gray-500">Sync to your calendar</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${addToGoogleCalendar ? 'text-green-600' : 'text-red-600'}`}>{addToGoogleCalendar ? 'ON' : 'OFF'}</span>
                    <button
                      onClick={() => setAddToGoogleCalendar(!addToGoogleCalendar)}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${addToGoogleCalendar ? 'bg-accent' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${addToGoogleCalendar ? 'translate-x-9' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </div>
                {/* Email Reminder */}
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl bg-accent/10">
                  <div>
                    <p className="font-semibold text-gray-900">📧 Email Reminder</p>
                    <p className="text-sm text-gray-500">Always enabled when reminders are on</p>
                  </div>
                  <span className="text-xl">✓</span>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setStepLocal('schedule')}
              className="flex-1 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={handleReminderSubmit}
              className="flex-1 py-3 bg-accent text-gray-900 font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Details (notes, photo, etc.)
  if (currentStep === 'details') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
          <ModalClose onClick={onClose} className="absolute top-3 right-3 text-2xl font-bold focus:outline-none" />
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">Details</h2>
          </div>
          <div className="text-center mb-8 flex flex-col items-center justify-center">
            {(() => {
              let imgName = ((selectedActivity?.name || selectedActivity?.id || '').toLowerCase().replace(/\s+/g, '-') + '-activity.png');
              if (selectedActivity?.id === 'feeding') imgName = 'food-activity.png';
              if (selectedActivity?.id === 'chilling') imgName = 'chill-activity.png';
              return <img src={`/${imgName}`} alt={selectedActivity?.label} style={{ width: '192px', maxWidth: '100%', height: 'auto', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />;
            })()}
            <p className="text-xl font-semibold text-gray-900 mt-4">{selectedActivity?.label}</p>
          </div>

          <div className="mb-6 flex flex-col md:flex-row items-start gap-6">
            <div className="flex-1">
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-accent focus:outline-none text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">
                {timing === 'upcoming' ? `📅 Scheduled for ${new Date(timestamp).toLocaleString()}` : '✓ Logged as complete'}
              </p>
            </div>

            {/* photo UI moved to its own slide (step === 'photo') */}
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-900 mb-3">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Add notes about this activity (optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none" />
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setStepLocal(timing === 'upcoming' ? 'reminder' : 'happened')}
              className="flex-1 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={() => setStepLocal('photo')}
              className="flex-1 py-3 bg-accent text-gray-900 font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 6: Photo (attach image)
  if (currentStep === 'photo') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
          <ModalClose onClick={onClose} className="absolute top-3 right-3 text-2xl font-bold focus:outline-none" />
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Photo</h2>
          </div>
          <div className="flex items-center justify-center mb-4">
            <img src={`/photo-activity.png`} alt="Add photo" style={{ width: 160, height: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="mb-6">
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" aria-label="Add photo" />
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="w-40 h-28 rounded-md overflow-hidden border border-gray-200">
                  <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-40 h-28 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">No photo</div>
              )}
              <div className="flex flex-col">
                <div className="flex gap-2">
                  <button type="button" onClick={triggerPhotoInput} className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200 transition cursor-pointer">Add photo</button>
                  {photoPreview && <button type="button" onClick={removePhoto} className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200 transition cursor-pointer">Remove</button>}
                </div>
                <div className="text-xs text-gray-500 mt-2">Optional — attach a photo for this activity</div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStepLocal('details')}
              className="flex-1 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={() => setStepLocal('summary')}
              className="flex-1 py-3 bg-accent text-gray-900 font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 6: Summary (final review + submit)
  if (currentStep === 'summary') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
          <ModalClose onClick={onClose} className="absolute top-3 right-3 text-2xl font-bold focus:outline-none" />
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">Summary</h2>
          </div>
          <div className="text-center mb-8 flex flex-col items-center justify-center">
            {(() => {
              let imgName = ((selectedActivity?.name || selectedActivity?.id || '').toLowerCase().replace(/\s+/g, '-') + '-activity.png');
              if (selectedActivity?.id === 'feeding') imgName = 'food-activity.png';
              if (selectedActivity?.id === 'chilling') imgName = 'chill-activity.png';
              return <img src={`/${imgName}`} alt={selectedActivity?.label} style={{ width: '192px', maxWidth: '100%', height: 'auto', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />;
            })()}
            <p className="text-xl font-semibold text-gray-900 mt-4">{selectedActivity?.label}</p>
            <button
              type="button"
              className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white ${addToFavourites ? 'bg-green-500' : 'bg-accent'} transition`}
              onClick={() => setAddToFavourites((v) => !v)}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.01 4.01 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 17.99 4 20 6.01 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              {addToFavourites ? 'Added to Favourites' : 'Add to Favourites'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show When, Photo, Notes, Reminder in summary for review */}
            <div className="text-left">
              <div className="text-xs text-gray-500">When</div>
              <div className="font-medium mb-3">{timestamp ? new Date(timestamp).toLocaleString() : (activity && activity.timestamp ? new Date(activity.timestamp).toLocaleString() : '')}</div>

              {(photoPreview || (activity && (activity.photoUrl || activity.data?.photoUrl))) && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500">Photo</div>
                  <div className="mt-2 w-full flex items-center justify-start">
                    <div className="w-40 h-28 rounded-md overflow-hidden border border-gray-200">
                      <img src={photoPreview || (activity.photoUrl && (activity.photoUrl.startsWith('http') ? activity.photoUrl : apiUrl(activity.photoUrl)))} alt="Activity photo" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              )}

              {notes && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500">Notes</div>
                  <div className="font-medium whitespace-pre-wrap">{notes}</div>
                </div>
              )}

              {reminderEnabled && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500">Reminder</div>
                  <div className="font-medium">{`Send ${reminderTime} minutes before${addToGoogleCalendar ? ' · Add to Google Calendar' : ''}`}</div>
                </div>
              )}
            </div>
            {/* Apply To Pets - allow multi-select when creating */}
            {/* Show for both new and editing activities */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">Apply to pets</label>
              <div className="mb-3">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Only unique pet IDs
                        setSelectedPetIds(Array.from(new Set(pets.map(p => p.id))));
                      } else {
                        setSelectedPetIds(petId ? [parseInt(petId)] : []);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Apply to all</span>
                </label>
              </div>
              <div className="space-y-2">
                {pets.length === 0 ? (
                  <p className="text-sm text-gray-500">No other pets found in household.</p>
                ) : (
                  pets.map((p) => {
                    const isCurrent = petId && parseInt(petId) === p.id;
                    return (
                      <label key={p.id} className={`flex items-center gap-3 ${isCurrent ? 'opacity-70' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedPetIds.includes(p.id)}
                          disabled={isCurrent}
                          onChange={(e) => {
                            if (isCurrent) return;
                            if (e.target.checked) {
                              setSelectedPetIds((s) => Array.from(new Set([...(s||[]), p.id])));
                            } else {
                              setSelectedPetIds((s) => (s || []).filter(id => id !== p.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className={`text-gray-700 ${isCurrent ? 'font-semibold' : ''}`}>{p.name}</span>
                        <span className="text-sm text-gray-400">({p.species})</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStepLocal('details')}
                className="flex-1 bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-200 transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent text-gray-900 font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Activity' : 'Log Activity')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

}
