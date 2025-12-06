// API helper - centralizes API base URL configuration
// Uses VITE_API_BASE env var or falls back to local dev server

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

/**
 * Helper to construct full API URLs
 * @param {string} path - API path starting with /
 * @returns {string} Full URL
 */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

/**
 * Fetch helper with error handling
 * @param {string} path - API path
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>}
 */
export async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
