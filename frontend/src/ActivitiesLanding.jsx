import React, { useEffect, useState } from 'react';
import ThemeSpinner from './ThemeSpinner';
import { Link } from 'react-router-dom';
import { apiFetch } from './api';

export default function ActivitiesLanding({ household, user, onSignOut }) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (household?.id) {
          const data = await apiFetch(`/api/households/${household.id}/pets`);
          if (!mounted) return;
          setPets(Array.isArray(data) ? data : []);
          return;
        }
        // fallback: no household — empty list
        setPets([]);
      } catch (err) {
        console.error('Failed to load household pets for activities landing', err);
        setPets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [household?.id]);

  return (
    <div className="min-h-screen bg-white">

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-sm text-gray-500">Select a pet to view its activities</p>
        </div>

        {loading ? (
          <ThemeSpinner label="Loading pets…" />
        ) : pets.length === 0 ? (
          <div className="text-gray-500">No pets found for this household.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map(p => (
              <Link key={p.id} to={`/pet/${p.id}/activities`} className="block border border-gray-200 rounded-lg p-4 hover:shadow">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                    {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <div className="text-2xl">🐾</div>}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.species ? p.species.charAt(0).toUpperCase()+p.species.slice(1) : ''} {p.breed ? `· ${p.breed}` : ''}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
