import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiUrl } from './api';

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const email = searchParams.get('email') || '';
  const household = searchParams.get('household') || '';

  useEffect(() => {
    if (!email || !household) {
      setError('Invalid invitation link.');
      setLoading(false);
      return;
    }
    fetch(apiUrl(`/api/invitations?email=${encodeURIComponent(email)}`))
      .then(res => res.json())
      .then(data => {
        const found = data.find(inv => String(inv.householdId) === String(household));
        if (!found) {
          setError('No pending invitation found for this link.');
        } else {
          setInvite(found);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load invitation.');
        setLoading(false);
      });
  }, [email, household]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // Create user account and accept invitation
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: email.split('@')[0],
          phoneNumber: null
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Registration failed.');
        setSubmitting(false);
        return;
      }
      // Store token from signup response
      const signupData = await res.json();
      if (signupData.token) {
        localStorage.setItem('token', signupData.token);
      }
      // Accept invitation (token is set after registration)
      const acceptRes = await fetch(apiUrl(`/api/households/${household}/members/accept-invitation`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${signupData.token}` }
      });
      if (!acceptRes.ok) {
        // If 404, treat as already accepted (auto-accept)
        if (acceptRes.status === 404) {
          setSuccess(true);
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        } else {
          setError('Failed to accept invitation.');
          setSubmitting(false);
          return;
        }
      }
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError('Something went wrong.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex flex-col items-center mt-16">Loading...</div>;
  if (error) return <div className="flex flex-col items-center mt-16 text-red-500">{error}</div>;
  if (success) return <div className="flex flex-col items-center mt-16 text-green-600">Welcome! Redirecting...</div>;

  return (
    <div className="flex flex-col items-center mt-16">
      <img src="/logo192.png" alt="PetDaily" className="h-16 mb-4" />
      <h1 className="text-2xl font-bold text-indigo-700 mb-2">Join Household</h1>
      <p className="mb-2">You've been invited as a <b>{invite.role}</b> to join a household on PetDaily.</p>
      <form className="w-full max-w-xs mt-4" onSubmit={handleSubmit}>
        <label className="block mb-2 text-sm font-medium">Email</label>
        <input className="w-full mb-4 p-2 border rounded bg-gray-100" value={email} disabled />
        <label className="block mb-2 text-sm font-medium">Create Password</label>
        <input className="w-full mb-4 p-2 border rounded" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        <button className="w-full bg-indigo-600 text-white py-2 rounded font-bold disabled:opacity-50" type="submit" disabled={submitting}>Accept & Join</button>
      </form>
    </div>
  );
}
