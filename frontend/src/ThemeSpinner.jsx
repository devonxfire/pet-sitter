import React from 'react';
import { theme } from './theme';

// A simple theme-aware spinner for loading states
export default function ThemeSpinner({ label = 'Loading...', className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-full min-h-screen ${className}`}
      style={{ minHeight: '100vh' }}
    >
      <span className="relative flex h-20 w-20 mb-6">
        <span className="animate-spin absolute inline-flex h-full w-full rounded-full border-8 border-solid border-[var(--color-accent)] border-t-transparent" />
        <span className="absolute inline-flex h-full w-full rounded-full opacity-20 bg-[var(--color-accent)]" />
      </span>
      <span className="text-gray-500 text-2xl font-semibold" style={{ color: theme.colors.textSecondary }}>{label}</span>
    </div>
  );
}
