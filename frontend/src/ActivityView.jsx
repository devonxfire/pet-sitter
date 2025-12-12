import React from 'react';
import { API_BASE } from './api';

export default function ActivityView({ activity, onClose, onEdit, onDelete }) {
  if (!activity) return null;

  const formatTs = (ts) => {
    try { return new Date(ts).toLocaleString(); } catch (e) { return ts; }
  };

  const rawLabel = activity._clientActionLabel || (activity.activityType && (activity.activityType.label || activity.activityType.name)) || activity.type || 'Activity';
  const typeLabel = String(rawLabel).charAt(0).toUpperCase() + String(rawLabel).slice(1);

  const resolvePhotoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // find a photo on the activity object if present
  const photoUrl = activity.photoUrl || activity.photo?.url || activity.data?.photoUrl || activity.data?.photo || activity.attachments?.find(a => a.type === 'photo')?.url || null;
  const resolvedPhoto = resolvePhotoUrl(photoUrl);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{typeLabel}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-3 text-sm text-gray-700">
          {resolvedPhoto && (
            <div className="w-full mb-2">
              <img src={resolvedPhoto} alt={typeLabel} className="w-full h-auto rounded-lg object-cover" />
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500">When</div>
            <div className="font-medium">{formatTs(activity.timestamp)}</div>
          </div>

          {activity.notes && (
            <div>
              <div className="text-xs text-gray-500">Notes</div>
              <div className="font-medium whitespace-pre-wrap">{activity.notes}</div>
            </div>
          )}

          {activity.user && (
            <div>
              <div className="text-xs text-gray-500">By</div>
              <div className="font-medium">{activity.user.name}</div>
            </div>
          )}

        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg">Close</button>
          <button onClick={() => onEdit && onEdit(activity)} className="btn">Edit</button>
          {onDelete && (
            <button
              ref={(el) => {
                if (el) el.style.setProperty('color', 'var(--color-accent)', 'important');
              }}
              onClick={() => onDelete(activity.id)}
              className="py-2 px-4 rounded-lg text-accent bg-red-50 delete-btn"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
