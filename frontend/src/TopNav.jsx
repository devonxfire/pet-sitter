import React, { useState, useRef, useEffect } from 'react';
// Utility to force transparent background on sign out button
function useForceTransparentSignOut() {
  useEffect(() => {
    const btn = document.querySelector('.mobile-signout-btn');
    if (btn) {
      btn.style.setProperty('background', 'transparent', 'important');
      btn.style.setProperty('background-color', 'transparent', 'important');
      btn.style.setProperty('box-shadow', 'none', 'important');
      btn.style.setProperty('outline', 'none', 'important');
      btn.style.setProperty('border', 'none', 'important');
      btn.style.setProperty('transition', 'none', 'important');
    }
  });
}
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './no-hover-effect.css';

export default function TopNav({ user, household, onSignOut }) {
  const [showNoHouseholdModal, setShowNoHouseholdModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const [firstPetId, setFirstPetId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className={user ? 'max-w-7xl mx-auto px-6 h-20 flex items-center justify-between' : 'max-w-6xl mx-auto px-6 h-20 flex items-center justify-between'}>
        {/* Left: logo */}
        <div className="flex items-center mr-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/petdaily-logo-desktop.png" alt="PetDaily" className="h-12 md:h-14 object-contain block transform -translate-y-2 md:-translate-y-1" />
          </Link>
        </div>

        {/* Center: primary nav (hidden on mobile) */}
        <div className="flex-1 hidden md:flex justify-center items-center">
          <div className="flex items-center gap-6">
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm text-gray-600 hover:text-gray-900 py-1 border-b transition-all duration-150 ${location.pathname === '/dashboard' ? 'border-accent nav-link-active' : 'border-transparent'}`}
                >My Pets</Link>
                <button
                    className={`no-global-accent text-sm text-gray-600 hover:text-gray-900 py-1 border-b-2 transition-all duration-150 ${location.pathname === '/household-settings' ? 'border-accent nav-link-active' : 'border-transparent'}`}
                    style={{
                      cursor: 'pointer',
                      background: 'transparent',
                      boxShadow: 'none',
                      outline: 'none',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderRadius: 0,
                      // Remove gray bg on hover for Settings only
                      transition: 'color 0.15s',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.setProperty('background', 'transparent', 'important');
                      e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.setProperty('background', 'transparent', 'important');
                      e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
                    }}
                  onClick={e => {
                    if (!household?.id) {
                      e.preventDefault();
                      setShowNoHouseholdModal(true);
                    } else {
                      navigate('/household-settings');
                    }
                  }}
                >Settings</button>
                {household?.id && (
                  <Link
                    to={`/household/${household.id}/calendar`}
                    className={`text-sm text-gray-600 hover:text-gray-900 py-1 border-b transition-all duration-150 ${location.pathname.includes('/calendar') ? 'border-accent nav-link-active' : 'border-transparent'}`}
                  >
                    Calendar
                  </Link>
                )}
              </>
            )}
            <Link
              to="/plans"
              className={`text-sm text-gray-600 hover:text-gray-900 py-1 border-b transition-all duration-150 ${location.pathname === '/plans' ? 'border-accent nav-link-active' : 'border-transparent'}`}
            >Plans</Link>
          </div>
        </div>

        {/* Right: user / actions and hamburger */}
        <div className="flex items-center ml-4">
          {/* Hamburger icon for mobile (right side) */}
          <div className="flex md:hidden mr-2">
            <button
              onClick={() => setMobileMenuOpen((s) => !s)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 focus:outline-none"
              aria-label="Open main menu"
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
          {user ? (
            <div className="relative flex items-center gap-3">
              {/* Only show dropdown on md+ screens */}
              <div className="hidden md:flex items-center gap-3" ref={menuRef}>
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
              </div>
              {/* Notification bell always visible */}
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

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-99999 bg-black bg-opacity-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 w-3/4 max-w-xs h-full bg-white shadow-lg p-6 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-4">
              {user && (
                <>
                  <Link to="/dashboard" className="text-lg text-gray-700 py-2 border-b border-gray-100" onClick={() => setMobileMenuOpen(false)}>My Pets</Link>
                  <button
                    className="no-global-accent text-lg text-gray-700 py-2 w-full text-left"
                    style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
                    onClick={e => {
                      setMobileMenuOpen(false);
                      if (!household?.id) {
                        e.preventDefault();
                        setShowNoHouseholdModal(true);
                      } else {
                        navigate('/household-settings');
                      }
                    }}
                  >Settings</button>
                  {household?.id && (
                    <Link to={firstPetId ? `/pet/${firstPetId}/calendar` : '#'} className="text-lg text-gray-700 py-2 border-b border-gray-100" onClick={() => setMobileMenuOpen(false)}>Calendar</Link>
                  )}
                </>
              )}
              <Link to="/plans" className="text-lg text-gray-700 py-2 border-b border-gray-100" onClick={() => setMobileMenuOpen(false)}>Plans</Link>
              {user ? (
                <>
                  <Link to="/profile" className="text-lg text-gray-700 py-2 border-b border-gray-100" onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onSignOut && onSignOut(); }}
                    className="text-lg text-gray-700 py-2 border-b border-gray-100 w-full text-left hover:bg-gray-100 no-global-accent"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/create-household" className="btn btn-red topnav-cta mb-2 text-lg" onClick={() => setMobileMenuOpen(false)}>Get started</Link>
                  <Link to="/login" className="text-lg text-accent hover:underline" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Must create or join household first for settings */}
      {showNoHouseholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-red-600 mb-4">Join or Create a Household</h3>
            <p className="mb-6 text-gray-700">You must join or create a household before you can access settings.</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-100 cursor-pointer"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowNoHouseholdModal(false)}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-accent text-white font-bold cursor-pointer"
                style={{ cursor: 'pointer' }}
                onClick={() => { setShowNoHouseholdModal(false); navigate('/create-household'); }}
              >Create Household</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
