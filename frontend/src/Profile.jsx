
import React, { useState, useEffect, useRef } from 'react';
import AvatarWithLoader from './PetDetail.jsx';
import { apiFetch, apiUrl, API_BASE } from './api';
import { toast, ToastContainer } from './Toast.jsx';



export default function Profile({ user, household, onSignOut }) {
  const [loading, setLoading] = useState(true);
  // Removed avatarLoading state
  const [error, setError] = useState(null);
  const [values, setValues] = useState({ name: '', firstName: '', lastName: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [imgError, setImgError] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch user data (for avatar and profile info)
  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/me');
      console.log('[Profile] /api/me response:', data);
      setValues({
        name: data.name || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phoneNumber: data.phoneNumber || ''
      });
      setCurrentUser(data);
      // Optionally update user in localStorage for consistency
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const merged = { ...stored, ...data };
        localStorage.setItem('user', JSON.stringify(merged));
      } catch (e) {}
    } catch (err) {
      console.error('[Profile] Failed to load profile', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      console.log('[Profile] setLoading(false) called');
      setLoading(false);
    }
  };
  useEffect(() => { fetchUser(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber
      };
      const updated = await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const merged = { ...stored, ...updated };
        localStorage.setItem('user', JSON.stringify(merged));
      } catch (e) {}
      toast('Profile updated');
    } catch (err) {
      console.error('Failed to save profile', err);
      toast(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      toast('Please provide current and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast('New password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await apiFetch('/api/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      toast('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change failed', err);
      toast(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };



  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />
      <main className="flex justify-center py-12">
        <div className="max-w-3xl w-full px-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="shrink-0">
              <input ref={fileInputRef => { window.__profileFileRef = fileInputRef; }} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                try {
                  const f = e.target.files && e.target.files[0];
                  if (!f) return;
                  // No avatarLoading
                  const form = new FormData();
                  form.append('photo', f);
                  const token = localStorage.getItem('token');
                  const resp = await fetch(apiUrl('/api/me/photo'), {
                    method: 'POST',
                    body: form,
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined
                  });
                  if (!resp.ok) {
                    const txt = await resp.text().catch(() => null);
                    toast('Failed to upload avatar: ' + (txt || resp.status));
                    setAvatarLoading(false);
                    return;
                  }
                  const j = await resp.json().catch(() => null);
                  if (j) {
                    try {
                      const stored = JSON.parse(localStorage.getItem('user') || '{}');
                      const merged = { ...stored, ...j };
                      localStorage.setItem('user', JSON.stringify(merged));
                    } catch (e) {}
                    await fetchUser(); // re-fetch user data for instant UI update
                    toast('Avatar updated');
                  }
                } catch (err) { console.error('Upload avatar failed', err); toast('Upload failed'); }
                // No avatarLoading
              }} />
              <button
                type="button"
                onClick={() => { try { (window.__profileFileRef || document.querySelector('input[type=file]')).click(); } catch (e) {} }}
                className="rounded-2xl bg-white p-1 relative"
                style={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', opacity: 1 }}
              >
                {currentUser?.photoUrl && !imgError ? (
                  (() => {
                    const baseUrl = currentUser.photoUrl.startsWith('http') ? currentUser.photoUrl : `${API_BASE}${currentUser.photoUrl}`;
                    const cacheBusted = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
                    console.log('Avatar image URL:', cacheBusted);
                    return <AvatarWithLoader
                      src={cacheBusted}
                      alt={currentUser?.name || 'Profile'}
                      key={baseUrl}
                      onError={() => setImgError(true)}
                    />;
                  })()
                ) : (
                  <div className="text-gray-400 text-4xl">👤</div>
                )}
                <span style={{ position: 'absolute', right: 6, bottom: 6, width: 22, height: 22, borderRadius: 9999, background: '#C3001F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} aria-hidden>+</span>
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Hi, {currentUser?.name || currentUser?.firstName || 'there'}!</h1>
              <div className="text-sm text-gray-600 mt-1">Current Role: {(() => {
                const prettify = (r) => {
                  if (!r) return 'Household Member';
                  const s = String(r).replace(/_/g, ' ').trim();
                  return s.split(' ').map(w => w ? (w[0].toUpperCase() + w.slice(1)) : '').join(' ');
                };
                try {
                  if (!household) return 'Household Member';
                  const members = household.members || household.users || [];
                  if (!Array.isArray(members) || members.length === 0) return 'Household Member';
                  const me = members.find(m => (m.user && String(m.user.id) === String(currentUser?.id)) || String(m.id) === String(currentUser?.id) || (m.user && String(m.user.email) === String(currentUser?.email)));
                  if (!me) return 'Household Member';
                  const raw = me.role || me.type || (me.isOwner ? 'owner' : me.title) || 'household_member';
                  return prettify(raw);
                } catch (e) { return 'Household Member'; }
              })()}</div>
            </div>
          </div>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          <section className="mb-8 border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={values.phoneNumber} onChange={(e) => setValues({ ...values, phoneNumber: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={currentUser?.email || ''} disabled className="w-full px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-gray-500" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:cursor-pointer">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Change password</h2>
            <div className="grid grid-cols-1 gap-4">
              <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200" />
              <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200" />
              <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200" />
            </div>
            <div className="mt-4">
              <button onClick={handlePasswordChange} disabled={changingPassword} className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:cursor-pointer">{changingPassword ? 'Updating...' : 'Change password'}</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
