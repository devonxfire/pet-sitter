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
  const [weightUnit, setWeightUnit] = useState('kg');
  const [notes, setNotes] = useState('');
  const [vetName, setVetName] = useState('');
  const [vetLocation, setVetLocation] = useState('');
  const [vetContact, setVetContact] = useState('');
  const [primaryFood, setPrimaryFood] = useState('');
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
        setWeightUnit(data.weightUnit || 'kg');
        setNotes(data.notes || '');
        setVetName(data.vetName || '');
        setVetLocation(data.vetLocation || '');
        setVetContact(data.vetContact || '');
        setPrimaryFood(data.primaryFood || '');
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
          weightUnit: weightUnit || 'kg',
          notes: notes || null,
          vetName: vetName || null,
          vetLocation: vetLocation || null,
          vetContact: vetContact || null,
          primaryFood: primaryFood || null
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

  // map helper removed — users will type addresses manually

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

      <main className="flex justify-center py-16">
        <div className="max-w-6xl px-6 w-full">
        <div className="mb-48">
          <h1 className="text-5xl font-bold text-gray-900">Edit {pet?.name}</h1>
        </div>

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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Weight (optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Amount"
                  min="0"
                  step="0.1"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="w-28 px-3 py-3 rounded-xl border border-gray-200 bg-white focus:border-accent focus:outline-none"
                >
                  <option value="kg">Kg</option>
                  <option value="lbs">Lbs</option>
                </select>
              </div>
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Vet Information */}
          <div style={{ marginBottom: '30px', paddingBottom: '30px' }} className="border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-16">Vet Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Vet Location (optional)</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={vetLocation}
                  onChange={(e) => setVetLocation(e.target.value)}
                  placeholder="Clinic address or name"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">Vet Name (optional)</label>
              <input
                type="text"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                placeholder="e.g., Dr. Smith or Happy Paws Vet"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">Vet Contact (optional)</label>
              <input
                type="tel"
                value={vetContact}
                onChange={(e) => setVetContact(e.target.value)}
                placeholder="Phone number"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Food Information */}
          <div style={{ marginBottom: '30px', paddingBottom: '30px' }} className="border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-16">Food Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Primary Food (optional)
              </label>
              <input
                type="text"
                value={primaryFood}
                onChange={(e) => setPrimaryFood(e.target.value)}
                placeholder="e.g., Kibble, Wet food, Raw"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-accent text-gray-900 font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
      </main>
    </div>
  );
}
