export const ACTIVITY_TYPES = [
  { id: 'feeding', label: 'Feeding', icon: '🍽️', color: 'bg-orange-100' },
  { id: 'walk', label: 'Walk', icon: '🚶', color: 'bg-blue-100' },
  { id: 'play', label: 'Play', icon: '🎾', color: 'bg-pink-100' },
  { id: 'medication', label: 'Medication', icon: '💊', color: 'bg-red-100' },
  { id: 'water', label: 'Water', icon: '💧', color: 'bg-cyan-100' },
  { id: 'grooming', label: 'Grooming', icon: '🛁', color: 'bg-purple-100' },
  { id: 'chilling', label: 'Chilling', icon: '📸', color: 'bg-yellow-100' },
  { id: 'other', label: 'Other', icon: '📝', color: 'bg-gray-100' }
];

export function getActivityLabel(key) {
  if (!key && key !== 0) return null;
  const k = String(key).toLowerCase();
  const found = ACTIVITY_TYPES.find(t => String(t.id).toLowerCase() === k || String(t.label).toLowerCase() === k || String(t.id) === String(key));
  return found ? found.label : null;
}

export default ACTIVITY_TYPES;
