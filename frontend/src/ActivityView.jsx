import React, { useRef, useEffect } from 'react';
import { API_BASE } from './api';
import ACTIVITY_TYPES from './activityTypes';
import ConfirmDialog from './ConfirmDialog';
import { useState } from 'react';

export default function ActivityView({ activity, onClose, onEdit, onDelete }) {
  if (!activity) return null;

  const formatTs = (ts) => {
    try { return new Date(ts).toLocaleString(); } catch (e) { return ts; }
  };


  // Find activity type definition for icon and label
  const typeDef = ACTIVITY_TYPES.find(t => t.id === (activity.activityType?.id || activity.activityType?.name || activity.type || activity.typeId || activity.id))
    || ACTIVITY_TYPES.find(t => t.label === (activity.activityType?.label || activity.activityType?.name || activity.type || activity.typeId || activity.id));
  const typeIcon = typeDef?.icon || null;
  let typeLabel = typeDef?.label || (activity._clientActionLabel || (activity.activityType && (activity.activityType.label || activity.activityType.name)) || activity.type || 'Activity');
  if (typeLabel && typeof typeLabel === 'string') typeLabel = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);

  const resolvePhotoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // find a photo on the activity object if present

  // Use the same image logic as LogActivity (show activity image if available, else fallback to default image for type)
  let imgName = ((typeDef?.name || typeDef?.id || typeLabel || '').toLowerCase().replace(/\s+/g, '-') + '-activity.png');
  // Normalize common special cases used elsewhere (feeding -> food-activity, chilling -> chill-activity)
  const typeLabelLower = (typeLabel || '').toLowerCase();
  const activityTypeName = (activity.activityType && (activity.activityType.name || activity.activityType.id)) || '';
  const activityTypeLower = String(activityTypeName).toLowerCase();
  if (typeDef?.id === 'feeding' || typeLabelLower.includes('feed') || activityTypeLower.includes('feed')) imgName = 'food-activity.png';
  if (typeDef?.id === 'chilling' || typeLabelLower.includes('chill') || activityTypeLower.includes('chill')) imgName = 'chill-activity.png';
  const fallbackImg = `/${imgName}`;
  const photoUrl = activity.photoUrl || activity.photo?.url || activity.data?.photoUrl || activity.data?.photo || activity.attachments?.find(a => a.type === 'photo')?.url || null;
  const resolvedPhoto = resolvePhotoUrl(photoUrl);
  const deleteBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    const el = deleteBtnRef.current;
    if (!el) return;
    // Force background and color with !important to override global styles
    el.style.setProperty('background', 'var(--brand-red, #C3001F)', 'important');
    el.style.setProperty('color', '#ffffff', 'important');
    el.style.setProperty('border', 'none', 'important');
    // cleanup not required — leave styles in place while mounted
  }, []);

  useEffect(() => {
    const c = closeBtnRef.current;
    if (!c) return;
    // Force close button to have no background/padding/border — use !important to beat global styles
    c.style.setProperty('background', 'transparent', 'important');
    c.style.setProperty('background-color', 'transparent', 'important');
    c.style.setProperty('box-shadow', 'none', 'important');
    c.style.setProperty('border', 'none', 'important');
    c.style.setProperty('padding', '0', 'important');
    // also ensure inner span is transparent
    const s = c.querySelector('span');
    if (s) {
      s.style.setProperty('background', 'transparent', 'important');
      s.style.setProperty('background-color', 'transparent', 'important');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
        <style>{`#activity-view-delete-btn{background: var(--brand-red, #C3001F) !important; color: #fff !important; border: none !important; } #activity-view-delete-btn:hover{ background: var(--brand-red-hover, #ED1C24) !important; } #activity-view-close-btn{ background: transparent !important; background-color: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }`}</style>
        <button
          id="activity-view-close-btn"
          className="absolute top-3 right-3 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
          style={{ lineHeight: 1, color: '#d1d5db', outline: 'none', cursor: 'pointer', WebkitTextStroke: '0', textShadow: 'none', filter: 'none', zIndex: 10, fontWeight: 400, fontSize: '1.8rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
        >
          <span style={{ color: '#d1d5db', background: 'none', border: 'none', boxShadow: 'none', textShadow: 'none', WebkitTextStroke: 0, filter: 'none', fontWeight: 300 }}>×</span>
        </button>
        <div className="flex flex-col items-center p-4 pt-2 w-full">
          <div className="flex flex-col items-center mb-2 w-full">
            {typeIcon && <span className="text-5xl mb-2">{typeIcon}</span>}
            <h2 className="text-2xl font-semibold text-gray-900 mb-0">{typeLabel}</h2>
          </div>
          <div className="w-full mb-4 flex items-center justify-center">
            <img
              src={resolvedPhoto || fallbackImg}
              alt={typeLabel}
              className="w-[192px] h-auto rounded-lg object-contain"
              style={{ maxWidth: '100%', margin: '0 auto', borderRadius: 0, boxShadow: 'none' }}
            />
          </div>
          <div className="space-y-3 text-base text-gray-700 w-full">
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
            {resolvedPhoto && (
              <div>
                <div className="text-xs text-gray-500">Photo</div>
                <div className="mt-2">
                  <img src={resolvedPhoto} alt="Activity photo" className="w-full max-w-[280px] h-auto rounded-md object-cover" />
                </div>
              </div>
            )}
          </div>
            <div className="flex flex-col md:flex-row gap-3 mt-8 w-full">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-md text-sm font-medium shadow-none hover:bg-gray-200 transition"
                style={{ minWidth: 0, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => onEdit && onEdit(activity)}
                className="flex-1 bg-[#C3001F] text-white py-2 rounded-md text-sm font-medium shadow-none hover:bg-[#ED1C24] transition"
                style={{ minWidth: 0, cursor: 'pointer' }}
              >
                Edit
              </button>
              {onDelete && (
                <>
                  <button
                    id="activity-view-delete-btn"
                    ref={deleteBtnRef}
                    onMouseEnter={() => {
                      const el = deleteBtnRef.current; if (el) el.style.setProperty('background', 'var(--brand-red-hover, #ED1C24)', 'important');
                    }}
                    onMouseLeave={() => {
                      const el = deleteBtnRef.current; if (el) el.style.setProperty('background', 'var(--brand-red, #C3001F)', 'important');
                    }}
                    onClick={() => setShowConfirmDelete(true)}
                    className="flex-1 text-white py-2 rounded-md text-sm font-medium shadow-none transition"
                    style={{ minWidth: 0, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                  {showConfirmDelete && (
                    <ConfirmDialog
                      title="Delete activity"
                      message={`Delete this activity? This cannot be undone.`}
                      onConfirm={() => { setShowConfirmDelete(false); onDelete && onDelete(activity.id); }}
                      onCancel={() => setShowConfirmDelete(false)}
                      confirmLabel="Delete"
                      cancelLabel="Cancel"
                    />
                  )}
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
