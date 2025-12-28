import React, { useState } from 'react';
import ThemeSpinner from './ThemeSpinner';
import ActivityView from './ActivityView';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { apiUrl } from './api';

// Placeholder for a calendar UI library/component
// You can replace this with a real calendar like react-calendar, FullCalendar, or similar
export default function HouseholdCalendarPage({ householdId, household }) {
  const [loading, setLoading] = React.useState(false);
        // Notification/ActivityView verb templates
        const VERB_TEMPLATES = {
          feeding: { past: 'was fed', future: 'is scheduled for feeding' },
          walk: { past: 'had a walk', future: 'has a walk scheduled' },
          play: { past: 'played', future: 'has playtime scheduled' },
          medication: { past: 'was given medication', future: 'has medication scheduled' },
          water: { past: 'was given water', future: 'has water scheduled' },
          grooming: { past: 'was groomed', future: 'has grooming scheduled' },
          chilling: { past: 'chilled out', future: 'is scheduled to chill' },
          photo: { past: 'had a photo taken', future: 'has a photo scheduled' },
          other: { past: 'had an activity', future: 'has an activity scheduled' }
        };

        function getPetName(act) {
          return pets.find(p => p.id === String(act.petId))?.name || act.petName || 'Unknown';
        }

        function getEventPhrase(act) {
          const now = new Date();
          const when = new Date(act.timestamp);
          const isFuture = when > now;
          let typeKey = (act.activityType?.name || '').toLowerCase();
          if (!typeKey) typeKey = 'other';
          // Try to match known types
          let verb = VERB_TEMPLATES[typeKey]?.[isFuture ? 'future' : 'past'];
          if (!verb) {
            // fallback: use 'activity' for unknowns
            verb = VERB_TEMPLATES['other'][isFuture ? 'future' : 'past'];
          }
          const petName = getPetName(act);
          // e.g. "Future play organised for Ben"
          if (isFuture) {
            // Use the same structure as notifications
            return `Future ${typeKey} organised for ${petName}`;
          } else {
            // e.g. "Play completed for Ben"
            return `${typeKey.charAt(0).toUpperCase() + typeKey.slice(1)} completed for ${petName}`;
          }
        }
      const [modalInfo, setModalInfo] = useState({ open: false, date: null, activities: [] });
      const [viewingActivity, setViewingActivity] = useState(null);
    const [calendarDate, setCalendarDate] = React.useState(new Date());
    // Placeholder: fetch pets and types for filters
    const [pets, setPets] = React.useState([]);
    const searchParams = new URLSearchParams(window.location.search);
    const initialPet = searchParams.get('pet') || '';
    const [selectedPet, setSelectedPet] = React.useState(initialPet);
    const [selectedType, setSelectedType] = React.useState('all');
  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'activity', label: 'Activity' },
    { value: 'appointment', label: 'Appointment' },
    { value: 'reminder', label: 'Reminder' },
  ];
  // Activities state
  const [activities, setActivities] = React.useState([]);
  // Fetch activities for selected pet or all pets
  React.useEffect(() => {
    async function fetchActivities() {
      if (!selectedPet) {
        setActivities([]);
        return;
      }
      let url = apiUrl(`/api/pets/${selectedPet}/activities?limit=200`);
      setLoading(true);
      try {
        const res = await fetch(url, {
          headers: { 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setActivities(data);
        } else {
          setActivities([]);
        }
      } catch {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }
    if (selectedPet) {
      fetchActivities();
    } else {
      setActivities([]);
    }
  }, [selectedPet, householdId]);
  React.useEffect(() => {
    async function fetchPets() {
      let hid = householdId;
      if (!hid) {
        const match = window.location.pathname.match(/household\/(\d+)/);
        if (match) hid = match[1];
      }
      if (!hid) {
        setPets([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/households/${hid}/pets`), {
          headers: { 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setPets(data.map(p => ({ id: String(p.id), name: p.name })));
        } else {
          setPets([]);
        }
      } catch {
        setPets([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPets();
  }, [householdId]);

  // Auto-select first pet if none selected or selectedPet not in pets list
  React.useEffect(() => {
    if (pets.length > 0 && (!selectedPet || !pets.some(p => p.id === selectedPet))) {
      setSelectedPet(pets[0].id);
    }
  }, [pets, selectedPet]);
  // Get current month/year
  const today = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  if (loading) {
    return <ThemeSpinner label="Loading calendar..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="flex justify-center py-16">
        <div className="max-w-6xl px-6 w-full">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{household?.name ? `${household.name} Calendar` : 'Household Calendar'}</h1>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select className="rounded border px-3 py-2" value={selectedPet} onChange={e => setSelectedPet(e.target.value)}>
          {pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
        </select>
        <select className="rounded border px-3 py-2" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
          {types.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </div>
          {/* Calendar UI */}
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col items-center">
        <Calendar
          onChange={setCalendarDate}
          value={calendarDate}
          className="w-full max-w-full no-global-accent"
          tileContent={({ date, view }) => {
            if (view !== 'month' || !activities.length) return null;
            // Find activities for this day
            const dayActivities = activities.filter(act => {
              const actDate = new Date(act.timestamp);
              return (
                actDate.getFullYear() === date.getFullYear() &&
                actDate.getMonth() === date.getMonth() &&
                actDate.getDate() === date.getDate() &&
                (selectedType === 'all' || (act.activityType && act.activityType.name && act.activityType.name.toLowerCase().includes(selectedType)))
              );
            });
            if (!dayActivities.length) return null;
            // Show up to 3 colored dots for activities
            return (
              <div className="flex gap-0.5 justify-center mt-1">
                {dayActivities.slice(0,3).map((act, idx) => {
                  let color = 'bg-blue-400';
                  const type = act.activityType?.name?.toLowerCase() || '';
                  if (type.includes('appointment')) color = 'bg-green-400';
                  else if (type.includes('reminder')) color = 'bg-yellow-400';
                  return <span key={idx} className={`w-2 h-2 rounded-full inline-block ${color}`}></span>;
                })}
                {dayActivities.length > 3 && <span className="text-xs ml-1">+{dayActivities.length-3}</span>}
              </div>
            );
          }}
          onClickDay={date => {
            // Find activities for this day
            const dayActivities = activities.filter(act => {
              const actDate = new Date(act.timestamp);
              return (
                actDate.getFullYear() === date.getFullYear() &&
                actDate.getMonth() === date.getMonth() &&
                actDate.getDate() === date.getDate() &&
                (selectedType === 'all' || (act.activityType && act.activityType.name && act.activityType.name.toLowerCase().includes(selectedType)))
              );
            });
            if (dayActivities.length) {
              setModalInfo({ open: true, date, activities: dayActivities });
            }
          }}
        />
        {/* Modal for day activities */}
        {modalInfo.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setModalInfo({ open: false, date: null, activities: [] })}>&times;</button>
              <h2 className="text-xl font-bold mb-2">Calendar for {modalInfo.date && modalInfo.date.toLocaleDateString()}</h2>
              {/* Group activities by type */}
              {(() => {
                const grouped = { activity: [], appointment: [], reminder: [] };
                modalInfo.activities.forEach(act => {
                  const type = act.activityType?.name?.toLowerCase() || '';
                  if (type.includes('appointment')) grouped.appointment.push(act);
                  else if (type.includes('reminder')) grouped.reminder.push(act);
                  else grouped.activity.push(act);
                });
                return (
                  <div>
                    {grouped.activity.length > 0 && (
                      <div className="mb-3">
                        <div className="font-bold text-accent mb-1">Activities</div>
                        <ul className="divide-y divide-gray-200">
                          {grouped.activity.map((act, idx) => (
                            <li
                              key={act.id || idx}
                              className="py-2 cursor-pointer hover:bg-gray-100 rounded transition"
                              onClick={() => setViewingActivity(act)}
                            >
                              <div className="font-semibold">{getEventPhrase(act)}</div>
                              <div className="text-gray-500 text-xs">{new Date(act.timestamp).toLocaleString()}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {grouped.appointment.length > 0 && (
                      <div className="mb-3">
                        <div className="font-bold text-green-700 mb-1">Appointments</div>
                        <ul className="divide-y divide-gray-200">
                          {grouped.appointment.map((act, idx) => (
                            <li
                              key={act.id || idx}
                              className="py-2 cursor-pointer hover:bg-gray-100 rounded transition"
                              onClick={() => setViewingActivity(act)}
                            >
                              <div className="font-semibold">{getEventPhrase(act)}</div>
                              <div className="text-gray-500 text-xs">{new Date(act.timestamp).toLocaleString()}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {grouped.reminder.length > 0 && (
                      <div className="mb-3">
                        <div className="font-bold text-yellow-700 mb-1">Reminders</div>
                        <ul className="divide-y divide-gray-200">
                          {grouped.reminder.map((act, idx) => (
                            <li
                              key={act.id || idx}
                              className="py-2 cursor-pointer hover:bg-gray-100 rounded transition"
                              onClick={() => setViewingActivity(act)}
                            >
                              <div className="font-semibold">{getEventPhrase(act)}</div>
                              <div className="text-gray-500 text-xs">{new Date(act.timestamp).toLocaleString()}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
      {/* ActivityView modal for selected activity */}
      {viewingActivity && (
        <ActivityView activity={viewingActivity} onClose={() => setViewingActivity(null)} />
      )}
          {/* Legend */}
          <div className="flex gap-4 mt-4 justify-center">
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-400 inline-block"></span>Activity</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-400 inline-block"></span>Appointment</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-yellow-400 inline-block"></span>Reminder</span>
      </div>
          {/* Extra vertical space below legend */}
          <div className="mb-8"></div>
          {/* Schedule button */}
          <div className="flex">
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-accent text-gray-900 font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition cursor-pointer mb-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true" focusable="false" style={{ flex: '0 0 auto' }}>
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
                <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span>Schedule New Appointment</span>
            </button>
          </div>
          {/* Modal for scheduling (to be implemented) */}
        </div>
      </main>
    </div>
  );
}
