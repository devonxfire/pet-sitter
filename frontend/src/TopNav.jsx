import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function TopNav({ user, household, onSignOut }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="border-b border-gray-200" style={{ padding: '16px 24px', backgroundColor: 'var(--color-accent)' }}>
      <div className="flex justify-center">
        <div className="max-w-6xl w-full px-6">
          <div className="flex items-center justify-between">
            {/* Left - primary nav */}
            <div className="flex items-center gap-6">
              <Link to="/" className="text-lg text-white hover:opacity-80 font-medium transition">Home</Link>
              <Link to="/dashboard" className="text-lg text-white hover:opacity-80 font-medium transition">My Household</Link>
              <Link to="/plans" className="text-lg text-white hover:opacity-80 font-medium transition">Plans</Link>
            </div>

            {/* Right - user area */}
            <div className="relative">
              {user ? (
                <>
                  <button
                    onClick={() => setOpen((s) => !s)}
                    className="flex items-center gap-3 text-white focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={open}
                    type="button"
                  >
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt={user.name || 'User'} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white text-accent flex items-center justify-center font-semibold">{initials(user?.name)}</div>
                    )}
                    <span className="text-white font-medium">Welcome{user?.name ? ` ${user.name.split(' ')[0]}` : ''}</span>
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={() => { setOpen(false); onSignOut && onSignOut(); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-white hover:opacity-80 font-medium">Log in</Link>
                  <Link to="/create-household" className="text-sm font-medium text-white bg-white/20 px-3 py-2 rounded-lg">Get started</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
