import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function TopNav({ user, household, onSignOut }) {
  const navigate = useNavigate();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Navigation Links - Centered */}
        <div className="flex items-center justify-center gap-8">
          <Link
            to="/"
            className="text-lg text-gray-700 hover:text-gray-900 font-medium transition"
          >
            Dashboard
          </Link>
          <Link
            to="/add-pet"
            state={household ? { household } : undefined}
            className="text-lg text-gray-700 hover:text-gray-900 font-medium transition"
          >
            Add Pet
          </Link>
          <Link
            to="/household-settings"
            className="text-lg text-gray-700 hover:text-gray-900 font-medium transition"
          >
            Settings
          </Link>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-lg text-gray-500 hover:text-gray-700 font-medium transition"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
