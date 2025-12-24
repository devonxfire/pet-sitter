import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Placeholder for a calendar UI library/component
// You can replace this with a real calendar like react-calendar, FullCalendar, or similar
export default function HouseholdCalendarPage({ householdId }) {
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
        let url = `/api/pets/${selectedPet}/activities?limit=200`;
        console.log('[Calendar] Fetching activities:', { url, selectedPet, householdId });
        try {
            const res = await fetch(url, {
                headers: { 'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                console.log('[Calendar] Activities fetched:', data);
                setActivities(data);
            } else {
                setActivities([]);
            }
        } catch {
            setActivities([]);
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
        // Try to get householdId from URL if not passed as prop
        if (!hid) {
            const match = window.location.pathname.match(/household\/(\d+)/);
            if (match) hid = match[1];
        }
        if (!hid) {
          setPets([]);
          return;
        }
        try {
          const res = await fetch(`/api/households/${hid}/pets`, {
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
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Household Calendar</h1>
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
        />
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center">
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-400 inline-block"></span>Activity</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-400 inline-block"></span>Appointment</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-yellow-400 inline-block"></span>Reminder</span>
      </div>
      {/* Schedule button */}
      <button className="w-full py-3 bg-accent text-white font-semibold rounded-xl text-lg hover:opacity-90 transition mb-2">Schedule</button>
      {/* Modal for scheduling (to be implemented) */}
    </div>
  );
}
