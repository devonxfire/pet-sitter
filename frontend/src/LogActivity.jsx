import React, { useState } from 'react';
import { apiFetch } from './api';
import ACTIVITY_TYPES from './activityTypes';
import { theme } from './theme';

export default function LogActivity({ petId, household, activity, onActivityLogged, onActivityDeleted, onClose, onFavouritesUpdated, step, setStep }) {
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
  console.log('[LogActivity] Render', { activity, petId, household, step });
  const [selectedType, setSelectedType] = useState(activity?.activityType?.name || '');
  const [timing, setTiming] = useState(''); // 'happened' or 'upcoming'
  const [notes, setNotes] = useState(activity?.notes || '');

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
  const isEditing = !!activity;
  const [addToFavourites, setAddToFavourites] = useState(false);

  const handleScheduleSubmit = () => {
    console.log('[LogActivity] handleScheduleSubmit', { timing, step });
    if (timing === 'upcoming') {
      setStep('reminder');
      console.log('[LogActivity] Set step to reminder');
    } else {
      setStep('details');
      console.log('[LogActivity] Set step to details');
    }
  };

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setStep('timing');
    console.log('[LogActivity] handleTypeSelect', { typeId, step });
  };

  const [, forceRerender] = useState(0);
  const handleTimingSelect = (timingChoice) => {
    console.log('[LogActivity] handleTimingSelect', { timingChoice, step });
    setTiming(timingChoice);
    if (timingChoice === 'happened') {
      setTimestamp(toLocalInputValue(new Date()));
      setStep('happened');
      console.log('[LogActivity] Set step to happened');
    } else {
      setStep('schedule');
      console.log('[LogActivity] Set step to schedule');
      setTimeout(() => forceRerender(n => n + 1), 0);
    }
  };

  const handleHappenedSubmit = () => {
    setStep('details');
  };

  const handleReminderSubmit = () => {
    console.log('[LogActivity] handleReminderSubmit called');
    setStep('details');
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
        // Update existing activity
        const data = await apiFetch(`/api/activities/${activity.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            timestamp: new Date(timestamp).toISOString(),
            notes: notes || null
          })
        });
        // attach client-side label if available
        const augmented = { ...data, _clientActionLabel: (data.activityType?.label || data.activityType?.name || typeDef.label || selectedType), _updatedActivity: true };
        if (typeof onActivityLogged === 'function') onActivityLogged(augmented);
        try { window.dispatchEvent(new CustomEvent('petSitter:updatedActivity', { detail: { activity: augmented } })); } catch (e) {}
        try {
          const payload = { householdId: household?.id, activity: augmented, ts: Date.now() };
          localStorage.setItem('petSitter:latestActivity', JSON.stringify(payload));
        } catch (e) {}
      } else {
        // Create new activity(s) for selected pet(s)
        const petIdsToSend = (selectedPetIds && selectedPetIds.length > 0)
          ? selectedPetIds.map(id => parseInt(id))
          : (petId ? [parseInt(petId)] : []);
        if (petIdsToSend.length === 0) {
          throw new Error('Please select at least one pet to apply this activity to.');
        }

        const promises = petIdsToSend.map((pid) => {
          const payload = {
            activityTypeId: selectedType,
            timestamp: new Date(timestamp).toISOString(),
            notes: notes || null,
            data: {}
          };
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
          try { if (typeof onActivityLogged === 'function') onActivityLogged(augmented); } catch (e) {}
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
  const [selectedPetIds, setSelectedPetIds] = useState(petId ? [parseInt(petId)] : []);

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
          // If no selectedPetIds yet, default to the current pet page (as a number)
          setSelectedPetIds((current) => {
            if (current && current.length > 0) return current;
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
  if (step === 'selectType') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 relative animate-fade-in" style={{padding: '2.5rem 2.5rem 2.5rem 2.5rem', minWidth: '700px'}}>
          <button
            className="absolute top-3 right-3 text-2xl font-bold focus:outline-none cursor-pointer"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: '#b0b0b0', padding: 0, boxShadow: 'none', lineHeight: 1, outline: 'none', cursor: 'pointer', zIndex: 10, fontWeight: 400, fontSize: '1.8rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
          >
            <span style={{ color: '#b0b0b0', fontWeight: 300 }}>×</span>
          </button>
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Activity Type</h2>
            <img src="/create-pet-food.png" alt="Activity" style={{ width: '220px', maxWidth: '100%', height: '110px', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />
          </div>
          {/* Force white background for activity type cards in this modal only */}
          <style>{`
            .activity-type-card-fix { background: #fff !important; background-color: #fff !important; }
          `}</style>
          <div className="grid grid-cols-4 gap-5">
            {ACTIVITY_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className="py-8 px-4 rounded-xl flex flex-col items-center gap-2 border border-gray-200 hover:bg-gray-50 hover:shadow transition-all duration-150 focus:outline-none activity-type-card-fix cursor-pointer"
                style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}
              >
                <img src="/create-pet-food.png" alt="Activity" style={{ width: '90px', height: '60px', objectFit: 'contain', marginBottom: '0.5rem', borderRadius: 0, boxShadow: 'none' }} />
                <span className="text-base font-medium text-gray-800 text-center">
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  
  }

  // Step 2: Timing - Happened or Upcoming
  if (step === 'timing') {
    console.log('[LogActivity] Rendering timing step', { step, timing });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2.5rem 2.5rem 2.5rem'}}>
          <button
            className="absolute top-3 right-3 text-2xl font-bold focus:outline-none"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: '#b0b0b0', padding: 0, boxShadow: 'none', lineHeight: 1, outline: 'none', cursor: 'pointer', zIndex: 10, fontWeight: 400, fontSize: '1.8rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
          >
            <span style={{ color: '#b0b0b0', fontWeight: 300 }}>×</span>
          </button>
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">When?</h2>
            <img src="/create-pet-food.png" alt="Activity" style={{ width: '220px', maxWidth: '100%', height: '110px', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />
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
            onClick={() => setStep('selectType')}
            className="mt-6 w-full py-3 text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Step 3b: Schedule (for upcoming)
  if (step === 'schedule') {
    console.log('[LogActivity] Rendering schedule step', { step, timing });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2.5rem 2.5rem 2.5rem'}}>
          <button
            className="absolute top-3 right-3 text-2xl font-bold focus:outline-none"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: '#b0b0b0', padding: 0, boxShadow: 'none', lineHeight: 1, outline: 'none', cursor: 'pointer', zIndex: 10, fontWeight: 400, fontSize: '1.8rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
          >
            <span style={{ color: '#b0b0b0', fontWeight: 300 }}>×</span>
          </button>
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Schedule Activity</h2>
            <img src="/create-pet-food.png" alt="Activity" style={{ width: '220px', maxWidth: '100%', height: '110px', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />
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
              onClick={() => setStep('timing')}
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
  if (step === 'happened') {
    console.log('[LogActivity] Rendering happened step', { step, timing });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2.5rem 2.5rem 2.5rem'}}>
          <button
            className="absolute top-3 right-3 text-2xl font-bold focus:outline-none"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: '#b0b0b0', padding: 0, boxShadow: 'none', lineHeight: 1, outline: 'none', cursor: 'pointer', zIndex: 10, fontWeight: 400, fontSize: '1.8rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
          >
            <span style={{ color: '#b0b0b0', fontWeight: 300 }}>×</span>
          </button>
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">When did it happen?</h2>
            <img src="/create-pet-food.png" alt="Activity" style={{ width: '220px', maxWidth: '100%', height: '110px', objectFit: 'contain', margin: '0 0 1.5rem 0', borderRadius: 0, boxShadow: 'none' }} />
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
              onClick={() => setStep('timing')}
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
  if (step === 'reminder') {
    console.log('[LogActivity] Rendering reminder step', { step, timing });
    console.log('[LogActivity] Rendering reminder step');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
          <button
            className="absolute top-3 right-3 text-2xl font-bold focus:outline-none"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', backgroundColor: 'transparent', border: 'none', padding: 0, boxShadow: 'none', lineHeight: 1, color: '#d1d5db', outline: 'none', cursor: 'pointer', WebkitTextStroke: '0', textShadow: 'none', filter: 'none', zIndex: 10, fontWeight: 400, fontSize: '1.8rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
          >
            <span style={{ color: '#d1d5db', background: 'none', border: 'none', boxShadow: 'none', textShadow: 'none', WebkitTextStroke: 0, filter: 'none', fontWeight: 300 }}>×</span>
          </button>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Set Reminder?</h2>
          </div>
          <div className="text-center mb-8">
            <span className="text-6xl">{selectedActivity?.icon}</span>
            <p className="text-xl font-semibold text-gray-900 mt-4">{selectedActivity?.label}</p>
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
              onClick={() => setStep('schedule')}
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

  // Step 5: Details (notes, photo, etc.) OR Edit Mode
  if (step === 'details' || step === 'edit') {
    console.log('[LogActivity] Rendering details step', { step, timing });
    // Log entry into details step for debugging
    console.log('[LogActivity] Entered details step. Timing:', timing);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
          <button
            className="absolute top-3 right-3 text-2xl font-bold focus:outline-none"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', backgroundColor: 'transparent', border: 'none', padding: 0, boxShadow: 'none', lineHeight: 1, color: '#d1d5db', outline: 'none', cursor: 'pointer', WebkitTextStroke: '0', textShadow: 'none', filter: 'none', zIndex: 10, fontWeight: 400, fontSize: '1.8rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
          >
            <span style={{ color: '#d1d5db', background: 'none', border: 'none', boxShadow: 'none', textShadow: 'none', WebkitTextStroke: 0, filter: 'none', fontWeight: 300 }}>×</span>
          </button>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Activity' : 'Summary'}</h2>
          </div>
          <div className="text-center mb-8">
            <span className="text-6xl">{selectedActivity?.icon}</span>
            <p className="text-xl font-semibold text-gray-900 mt-4">{selectedActivity?.label}</p>
          </div>
          <div className="mb-6">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Activity Type (Edit mode only) */}
          {isEditing && (
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Activity Type
              </label>
              <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium">
                {activity.activityType?.name}
              </div>
            </div>
          )}

          {/* Timestamp (Edit mode only) */}
          {isEditing && (
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-accent focus:outline-none"
              />
            </div>
          )}

          {/* Apply To Pets - allow multi-select when creating */}
          {!isEditing && (
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-3">Apply to pets</label>
              <div className="mb-3">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedPetIds(pets.map(p => p.id));
                      else setSelectedPetIds(petId ? [parseInt(petId)] : []);
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
                            if (e.target.checked) setSelectedPetIds((s) => [...new Set([...(s||[]), p.id])]);
                            else setSelectedPetIds((s) => (s || []).filter(id => id !== p.id));
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
          )}

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-gray-100 text-red-600 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <button
              type="button"
              onClick={() => isEditing ? onClose() : setStep(timing === 'upcoming' ? 'reminder' : 'happened')}
              className="flex-1 bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-200 transition cursor-pointer"
            >
              {isEditing ? 'Cancel' : '← Back'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent text-gray-900 font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  }}
