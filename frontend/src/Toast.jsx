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

  // Centered, green, always above nav/content, responsive
  return (
    <div
      className="fixed left-0 w-full flex flex-col items-center pointer-events-none"
      style={{ top: 0, zIndex: 99999 }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            `pointer-events-auto bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl mt-6 mb-2 text-lg font-semibold flex items-center justify-center animate-fade-in ${t.opts.className || ''}`
          }
          style={{
            minWidth: 220,
            maxWidth: '90vw',
            width: 'fit-content',
            boxShadow: '0 6px 32px 0 rgba(0,0,0,0.18)',
            textAlign: 'center',
            ...t.opts.style,
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
