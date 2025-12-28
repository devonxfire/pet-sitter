import React, { useState, useEffect } from 'react';

export function toast(message, opts = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, opts } }));
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handler(e) {
      const { message, opts } = e.detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, opts }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, opts.duration || 3000);
    }
    window.addEventListener('show-toast', handler);
    return () => window.removeEventListener('show-toast', handler);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ marginBottom: 12 }} className="bg-gray-900 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          {t.message}
        </div>
      ))}
    </div>
  );
}
