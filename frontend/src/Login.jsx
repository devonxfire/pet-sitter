import React, { useState } from 'react';
import { apiFetch } from './api';
import { Link } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isMainMember, setIsMainMember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignup 
        ? { 
            email, 
            password, 
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            phoneNumber: phoneNumber || null,
            isMainMember
          } 
        : { email, password };
      
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-white px-4 pt-10 md:pt-16">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl shadow-lg bg-white p-8">
        <div className="text-center mb-10">
          <img
            src="/walk-activity.png"
            alt="Walk Activity"
            className="mx-auto mb-8"
            style={{ width: 200, height: 200, objectFit: 'contain' }}
          />
          <h1 className="text-3xl font-medium text-gray-900 mb-2">
            PetDaily
          </h1>
          <p className="text-gray-500 text-sm">Track pet care with your family</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Phone Number (optional)</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              required
            />

            <div className="flex justify-between items-center mt-2 text-sm">
              <Link to="/forgot-password" className="text-accent hover:underline" aria-label="Forgot password">Forgot password?</Link>
              <Link to="/" className="text-gray-500 hover:underline" aria-label="Back to home">Back to Home</Link>
            </div>
          </div>

          {isSignup && (
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMainMember}
                  onChange={(e) => setIsMainMember(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-(--color-accent)"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">I'm the main household member</div>
                  {!isMainMember && (
                    <div className="text-xs text-gray-500 mt-1">
                      You'll be able to join a household when invited by the main member
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <span
            role="button"
            tabIndex={0}
            onClick={() => setIsSignup(!isSignup)}
            onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setIsSignup(!isSignup); }}
            className="text-accent hover:underline cursor-pointer text-sm"
            aria-label={isSignup ? 'Already have an account? Sign in' : 'Create account'}
          >
            {isSignup ? 'Already have an account? Sign in' : 'Create account →'}
          </span>
        </div>
      </div>
    </div>
  );
}
