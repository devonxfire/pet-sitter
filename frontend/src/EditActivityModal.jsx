import React, { useState } from 'react';
import { apiFetch } from './api';

export default function EditActivityModal({ activity, onActivityUpdated, onClose }) {
  // Parse timestamp robustly and produce a local datetime-local input value
  const parseTimestamp = (ts) => {
    if (!ts) return new Date(NaN);
    try {
      if (typeof ts === 'string') {
        const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z)?$/;
        const m = ts.match(isoLike);
        if (m && !m[1]) return new Date(ts + 'Z');
      }
      return new Date(ts);
    } catch (e) {
      return new Date(ts);
    }
  };

  const toLocalInputValue = (date) => {
    if (!(date instanceof Date)) date = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [timestamp, setTimestamp] = useState(
    toLocalInputValue(parseTimestamp(activity.timestamp))
  );
  const [notes, setNotes] = useState(activity.notes || '');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          timestamp: new Date(timestamp).toISOString(),
          notes: notes || null
        })
      });

      console.log('✅ Activity updated:', data);
      onActivityUpdated(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    setError('');
    setDeleting(true);

    try {
      await apiFetch(`/api/activities/${activity.id}`, {
        method: 'DELETE'
      });

      console.log('✅ Activity deleted');
      onActivityUpdated(null); // Signal deletion
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete activity');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Activity</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Activity Type
            </label>
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900">
              {activity.activityType?.name || 'Activity'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Time
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add or edit notes..."
              rows="3"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-gray-100 text-red-600 font-semibold py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-900 font-semibold py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
