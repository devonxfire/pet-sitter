import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from './api';
import TopNav from './TopNav';

export default function EditPet({ user, onSignOut }) {
  const navigate = useNavigate();
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const data = await apiFetch(`/api/pets/${petId}`);
        setPet(data);
        setPetName(data.name);
        setSpecies(data.species);
        setBreed(data.breed || '');
        setAge(data.age?.toString() || '');
        setWeight(data.weight?.toString() || '');
        setNotes(data.notes || '');
      } catch (err) {
        setError(err.message || 'Failed to load pet');
      } finally {
        setLoading(false);
      }
    };

    if (petId) {
      fetchPet();
    }
  }, [petId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!petName.trim() || !species) {
        setError('Pet name and species are required');
        setSaving(false);
        return;
      }

      await apiFetch(`/api/pets/${petId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: petName.trim(),
          species: species.toLowerCase(),
          breed: breed || null,
          age: age ? parseInt(age) : null,
          weight: weight ? parseFloat(weight) : null,
          notes: notes || null
        })
      });

      console.log('✅ Pet updated:', petName);
      navigate(`/pet/${petId}`);
    } catch (err) {
      setError(err.message || 'Failed to update pet');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 px-4 py-4">
          <button
            onClick={() => navigate(`/pet/${petId}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav user={user} onSignOut={onSignOut} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/pet/${petId}`)}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit {pet?.name}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pet Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Pet Name *
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="e.g., Milo, Luna, Buddy"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
              required
            />
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Species *
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="rabbit">Rabbit</option>
              <option value="hamster">Hamster</option>
              <option value="guinea pig">Guinea Pig</option>
              <option value="fish">Fish</option>
              <option value="reptile">Reptile</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Breed (optional)
            </label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="e.g., Labrador Retriever"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
            />
          </div>

          {/* Age and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Age (optional)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Years"
                min="0"
                max="100"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Weight (optional)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Lbs/kg"
                min="0"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special info... allergies, preferences, etc."
              rows="3"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#39FF14] focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#39FF14] text-gray-900 font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  );
}
