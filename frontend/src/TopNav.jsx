import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function TopNav({ user, household, onSignOut }) {
  const navigate = useNavigate();

  return (
    <nav className="border-b border-gray-200" style={{ padding: '24px 24px', backgroundColor: '#20B2AA' }}>
      <div className="flex justify-center">
        <div className="max-w-6xl w-full px-6">
          {/* Navigation Links - Centered */}
          <div className="flex items-center justify-center gap-8">
            <Link
              to="/"
              className="text-lg text-white hover:opacity-80 font-medium transition"
            >
              Dashboard
            </Link>
            <Link
              to="/add-pet"
              state={household ? { household } : undefined}
              className="text-lg text-white hover:opacity-80 font-medium transition"
            >
              Add Pet
            </Link>
            <Link
              to="/household-settings"
              className="text-lg text-white hover:opacity-80 font-medium transition"
            >
              Settings
            </Link>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="text-lg text-white hover:opacity-80 font-medium transition"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
