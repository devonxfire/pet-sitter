import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ user }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-50 text-gray-900 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="shrink-0">
            <h3 className="text-lg font-semibold flex items-center gap-2">🐶 Pet Sitter</h3>
            <p className="text-sm text-gray-700 mt-1">Simple household pet care and activity tracker.</p>
            <p className="text-sm text-gray-500 mt-3">© {year} Pet Sitter. All rights reserved.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2">📌 Site</h4>
              <ul className="mt-2 text-sm text-gray-700 space-y-2">
                <li><Link to="/" className="hover:underline hover:text-gray-900">Home</Link></li>
                <li><Link to="/dashboard" className="hover:underline hover:text-gray-900">Dashboard</Link></li>
                <li><Link to="/add-pet" className="hover:underline hover:text-gray-900">Add Pet</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2">👤 Account</h4>
              <ul className="mt-2 text-sm text-gray-700 space-y-2">
                {user ? (
                  <li><Link to="/profile" className="hover:underline hover:text-gray-900">Profile</Link></li>
                ) : (
                  <li><Link to="/login" className="hover:underline hover:text-gray-900">Sign in</Link></li>
                )}
                <li><Link to="/household-settings" className="hover:underline hover:text-gray-900">Household</Link></li>
                <li><Link to="/dashboard" className="hover:underline hover:text-gray-900">Favourites</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2">📜 Legal</h4>
              <ul className="mt-2 text-sm text-gray-700 space-y-2">
                <li><Link to="/terms" className="hover:underline hover:text-gray-900">Terms</Link></li>
                <li><Link to="/privacy" className="hover:underline hover:text-gray-900">Privacy</Link></li>
                <li><Link to="/contact" className="hover:underline hover:text-gray-900">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
