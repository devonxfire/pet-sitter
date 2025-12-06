import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function TopNav({ user, household, onSignOut }) {
  const navigate = useNavigate();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-xl font-semibold text-gray-900"
          >
            Pet-Sitter
          </button>
          {household?.name && (
            <span className="text-sm text-gray-500">{household.name}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/add-pet"
            state={household ? { household } : undefined}
            className="text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            Add Pet
          </Link>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          )}
          {user?.name && (
            <span className="text-sm text-gray-600">{user.name}</span>
          )}
        </div>
      </div>
    </nav>
  );
}
