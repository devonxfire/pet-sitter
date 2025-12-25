import React, { useState, useEffect } from 'react';
import ThemeSpinner from './ThemeSpinner';
import { useNavigate } from 'react-router-dom';
import { apiFetch, apiUrl } from './api';

// Convert role keys into user-friendly English labels
const prettifyRole = (role, description) => {
  if (!role) return '';
  const map = {
    owner: 'Owner',
    member: 'Member',
    household_member: 'Household Member',
    household_friend: 'Household Friend',
    pet_sitter: 'Pet Sitter',
    dog_walker: 'Dog Walker',
    groomer: 'Groomer',
    other: description || 'Other'
  };
  if (map[role]) return map[role];
  // Fallback: replace underscores with spaces and Title Case
  const s = String(role).replace(/_/g, ' ').trim();
  return s.split(' ').map(w => w ? (w[0].toUpperCase() + w.slice(1)) : '').join(' ');
};

export default function HouseholdSettings({ household, user, onSignOut }) {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('household_member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteOtherDescription, setInviteOtherDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [localPlan, setLocalPlan] = useState(household?.plan || 'free');

  useEffect(() => {
    if (!household) {
      navigate('/dashboard');
      return;
    }
    fetchMembers();
  }, [household]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/households/${household.id}/members`);
      setMembers(data);
    } catch (err) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  // Current member record for the signed-in user (if any)
  const currentUserMember = members.find(m => m.userId === user.id);

  // small helper
  const capitalize = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

  const handleChangePlan = async (newPlan) => {
    setError('');
    setSuccessMessage('');
    try {
      await apiFetch(`/api/households/${household.id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ plan: newPlan })
      });
      // Try to refresh household list and update local plan without full reload
      try {
        const households = await apiFetch('/api/households');
        const updated = Array.isArray(households) ? households.find(h => h.id === household.id) : null;
        if (updated && updated.plan) {
          setLocalPlan(updated.plan);
          try { localStorage.setItem('household', JSON.stringify({ ...household, plan: updated.plan })); } catch (e) {}
          if (typeof onSignOut === 'function' && typeof window !== 'undefined') {
            // notify parent if it listens via a custom event
            try { window.dispatchEvent(new CustomEvent('householdUpdated', { detail: updated })); } catch (e) {}
          }
        } else {
          setLocalPlan(newPlan);
          try { localStorage.setItem('household', JSON.stringify({ ...household, plan: newPlan })); } catch (e) {}
        }
      } catch (e) {
        // fallback: use the chosen plan
        setLocalPlan(newPlan);
      }
      setSuccessMessage(`Plan updated to ${capitalize(newPlan)}.`);
      setShowUpgrade(false);
    } catch (err) {
      setError(err.message || 'Failed to update plan');
    }
  };

  useEffect(() => {
    setLocalPlan(household?.plan || 'free');
  }, [household]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!inviteEmail) {
      setError('Email is required');
      return;
    }

    try {
      await apiFetch(`/api/households/${household.id}/members/invite`, {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          welcomeMessage: inviteMessage || null,
          roleDescription: inviteRole === 'other' ? (inviteOtherDescription || null) : null
        })
      });

      setSuccessMessage(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('household_member');
      setInviteMessage('');
      setInviteOtherDescription('');
      fetchMembers();
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the household?')) {
      return;
    }

    try {
      await apiFetch(`/api/households/${household.id}/members/${memberId}`, {
        method: 'DELETE'
      });
      fetchMembers();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ThemeSpinner label="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <main className="flex justify-center py-16">
        <div className="max-w-6xl px-6 w-full">

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Household Settings</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {/* Household Info */}
        <section style={{ marginBottom: '16px', paddingBottom: '8px' }} className="border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Household Info</h2>
          <div className="space-y-2">
            <p><span className="text-gray-500">Name:</span> {household.name}</p>
            {household.address && <p><span className="text-gray-500">Address:</span> {household.address}</p>}
            {household.city && <p><span className="text-gray-500">City:</span> {household.city}, {household.state}</p>}
            <p>
              <span className="text-gray-500">Plan:</span> {capitalize(localPlan || household.plan || 'free')}
              {currentUserMember?.role === 'owner' && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="ml-3 inline-flex items-center gap-2 bg-accent text-gray-900 font-semibold py-1 px-3 rounded-lg hover:opacity-90 transition cursor-pointer text-sm"
                >
                  Upgrade
                </button>
              )}
            </p>
          </div>
        </section>

        {/* Members List */}
        <section style={{ marginBottom: '16px', paddingBottom: '8px' }} className="border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Members</h2>
          {members.length === 0 ? (
            <p className="text-gray-500">No members yet</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                // Find current user's role in this household
                const currentUserMember = members.find(m => m.userId === user.id);
                const isOwner = currentUserMember?.role === 'owner';
                
                return (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {member.user ? member.user.name : member.invitedEmail}
                    </p>
                    <p className="text-sm text-gray-500">
                      {member.user ? member.user.email : `Pending invitation to ${member.invitedEmail}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Role: {prettifyRole(member.role, member.roleDescription)}
                      {!member.user && ' • Not yet joined'}
                    </p>
                  </div>

                  {isOwner && member.userId !== user.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="ml-4 text-red-600 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Invite Members */}
        {(() => {
          const currentUserMember = members.find(m => m.userId === user.id);
          const allowedRoles = ['owner', 'member', 'household_member', 'household_friend'];
          const canInvite = !!(currentUserMember && allowedRoles.includes(currentUserMember.role));
          if (!canInvite) return null;
          return (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite Members</h2>
              <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              >
                <option value="household_member">Household Member</option>
                <option value="household_friend">Household Friend</option>
                <option value="pet_sitter">Pet Sitter</option>
                <option value="dog_walker">Dog Walker</option>
                <option value="groomer">Groomer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {inviteRole === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Please describe the role</label>
                <input
                  type="text"
                  value={inviteOtherDescription}
                  onChange={(e) => setInviteOtherDescription(e.target.value)}
                  placeholder="e.g. 'Neighbour who helps with feeding and check-ins'"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome message (optional)</label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Optional: add a short welcome message that will be included with the invitation (e.g. 'Hi — I'm Alex, welcome to our household! You'll be able to add activities and receive notifications.')"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              />
            </div>

            <div className="flex">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-accent text-gray-900 font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true" focusable="false" style={{ flex: '0 0 auto' }}>
                  <path fill="white" d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                </svg>
                <span>Send Invitation</span>
              </button>
            </div>
              </form>
            </section>
          );
        })()}
            {showUpgrade && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold mb-4">Upgrade Household Plan</h3>
                  <p className="text-sm text-gray-600 mb-4">Current plan: {capitalize(localPlan || household.plan || 'free')}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-semibold">Premium</div>
                        <div className="text-xs text-gray-500">Extra features (placeholder)</div>
                      </div>
                      <button onClick={() => handleChangePlan('premium')} className="bg-accent text-white px-3 py-1 rounded">Upgrade</button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-semibold">Business</div>
                        <div className="text-xs text-gray-500">Team features (placeholder)</div>
                      </div>
                      <button onClick={() => handleChangePlan('business')} className="bg-accent text-white px-3 py-1 rounded">Upgrade</button>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button onClick={() => setShowUpgrade(false)} className="px-4 py-2 rounded bg-gray-100">Close</button>
                  </div>
                </div>
              </div>
            )}
      </div>
      </main>
    </div>
  );
}
