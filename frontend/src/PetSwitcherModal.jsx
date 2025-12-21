import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PetSwitcherModal({ pets = [], currentPetId, onClose }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!rootRef.current) return;
    try {
      // enforce modal styles to avoid global overrides
      const el = rootRef.current;
      el.style.setProperty('background', '#ffffff', 'important');
      el.style.setProperty('border-radius', '0.5rem', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
      el.style.setProperty('box-shadow', '0 8px 24px rgba(0,0,0,0.12)', 'important');
    } catch (e) {}
  }, []);

  const handleSelect = (p) => {
    try { navigate(`/pet/${p.id}/activities`); } catch (e) { window.location.href = `/pet/${p.id}/activities`; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div ref={rootRef} className="w-full max-w-md mx-4" style={{ background: '#fff', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <div className="text-lg font-semibold">Switch pet</div>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {(!pets || pets.length === 0) ? (
            <div className="p-4 text-sm text-gray-500">No pets</div>
          ) : (
            pets.map(p => (
              <div key={p.id} className="px-4 py-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400" style={{ flex: '0 0 40px' }}>
                    {p.photoUrl ? <img src={p.photoUrl.startsWith('http') ? p.photoUrl : p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-xl">🐾</span>}
                  </div>
                  <div>
                    <div className={`font-medium ${String(p.id) === String(currentPetId) ? 'text-gray-500' : 'text-gray-900'}`}>{p.name}</div>
                    {p.type && <div className="text-xs text-gray-500">{p.type}</div>}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => handleSelect(p)}
                    className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
                    style={{ border: 'none' }}
                    type="button"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 text-right">
          <button onClick={onClose} className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
}
