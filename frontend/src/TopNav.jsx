import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './no-hover-effect.css';
import { apiFetch } from './api';
import { useMemo } from 'react';

export default function TopNav({ user, household, onSignOut }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Always apply .page-non-landing for consistent nav style, even on landing
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('page-non-landing');
    return () => {
      document.body.classList.remove('page-non-landing');
    };
  }, [location?.pathname]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const [firstPetId, setFirstPetId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!household?.id) return;
      try {
        const data = await apiFetch(`/api/households/${household.id}/pets`);
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) setFirstPetId(data[0].id);
      } catch (err) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [household?.id]);

  const initials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Close menu on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuRef]);

  return (
    <nav className={`relative z-9999 h-20 md:h-20 ${location?.pathname !== '/' ? 'border-b border-gray-100' : ''}`} style={{ pointerEvents: 'auto' }}>
      {/**
       * When a user is logged in we prefer the dashboard-style top menu that
       * stretches across the full width. For logged-out users keep the narrower
       * centered layout.
       */}
      <div className={user ? 'max-w-7xl mx-auto px-6 h-20 flex items-center' : 'max-w-6xl mx-auto px-6 h-20 flex items-center'}>
        {/* Left: logo */}
        <div className="flex items-center mr-4">
            <Link to="/" className="flex items-center gap-3">
            <img src="/petdaily-logo-desktop.png" alt="PetDaily" className="h-12 md:h-14 object-contain block transform -translate-y-2 md:-translate-y-1" />
          </Link>
        </div>

        {/* Center: primary nav (centered) */}
          <div className="flex-1 flex justify-center items-center">
          <div className="flex items-center gap-6">
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm text-gray-600 hover:text-gray-900 py-1 border-b transition-all duration-150 ${location.pathname === '/dashboard' ? 'border-accent nav-link-active' : 'border-transparent'}`}
                >My Pets</Link>
                <Link
                  to="/household-settings"
                  className={`text-sm text-gray-600 hover:text-gray-900 py-1 border-b transition-all duration-150 ${location.pathname === '/household-settings' ? 'border-accent nav-link-active' : 'border-transparent'}`}
                >Settings</Link>
              </>
            )}
            <Link
              to="/plans"
              className={`text-sm text-gray-600 hover:text-gray-900 py-1 border-b transition-all duration-150 ${location.pathname === '/plans' ? 'border-accent nav-link-active' : 'border-transparent'}`}
            >Plans</Link>
          </div>
        </div>

        {/* Right: user / actions */}
        <div className="flex items-center ml-4">
          {user ? (
            <div ref={menuRef} className="relative flex items-center gap-3">
              <button
                onClick={() => setOpen((s) => !s)}
                className="user-toggle no-global-accent cursor-pointer flex items-center gap-3 text-gray-900 focus:outline-none px-3 py-2"
                aria-haspopup="true"
                aria-expanded={open}
                type="button"
              >
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name || 'User'} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-user-initials text-white flex items-center justify-center font-semibold">{initials(user?.name)}</div>
                )}
                <span className="text-gray-900 font-medium leading-none">Welcome{user?.name ? `, ${user.name.split(' ')[0]}!` : '!'}</span>
                <svg className="w-4 h-4 text-gray-500 ml-1" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {open && (
                <div
                  className="absolute right-0 top-full mt-3 w-44 bg-white rounded-lg shadow-lg z-99999"
                  style={{ pointerEvents: 'auto' }}
                  onClick={e => e.stopPropagation()}
                >
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dropdown-item" onClick={() => setOpen(false)}>My Profile</Link>
                  <button
                    onClick={() => { setOpen(false); onSignOut && onSignOut(); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dropdown-item"
                  >
                    Sign out
                  </button>
                </div>
              )}

              {/* Notification bell sits to the right of the welcome button */}
              <NotificationBell navigate={navigate} />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/create-household" className="hidden sm:inline-block btn btn-red topnav-cta">Get started</Link>
              <Link to="/login" className="text-sm text-accent hover:underline">Sign in</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
