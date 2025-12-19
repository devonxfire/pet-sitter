import React, { useRef, useEffect } from 'react';

export default function ModalClose({ onClick, className = '', id, label = 'Close' }) {
  const btnRef = useRef(null);

  useEffect(() => {
    const c = btnRef.current;
    if (!c) return;
    c.style.setProperty('background', 'transparent', 'important');
    c.style.setProperty('background-color', 'transparent', 'important');
    c.style.setProperty('box-shadow', 'none', 'important');
    c.style.setProperty('border', 'none', 'important');
    c.style.setProperty('padding', '0', 'important');
    c.style.setProperty('z-index', '1000', 'important');
    const s = c.querySelector('span');
    if (s) {
      s.style.setProperty('background', 'transparent', 'important');
      s.style.setProperty('background-color', 'transparent', 'important');
      s.style.setProperty('color', '#d1d5db', 'important');
      s.style.setProperty('font-size', '1.8rem', 'important');
    }
  }, []);

  return (
    <button
      id={id}
      ref={btnRef}
      className={className}
      onClick={onClick}
      aria-label={label}
      style={{ lineHeight: 1, color: '#d1d5db', outline: 'none', cursor: 'pointer', WebkitTextStroke: '0', textShadow: 'none', filter: 'none', zIndex: 1000, fontSize: '1.8rem' }}
    >
      <span style={{ color: '#d1d5db', background: 'none', border: 'none', boxShadow: 'none', textShadow: 'none', WebkitTextStroke: 0, filter: 'none', fontWeight: 300, fontSize: '1.8rem' }}>×</span>
    </button>
  );
}
