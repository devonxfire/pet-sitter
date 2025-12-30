
import React, { useState, useEffect, useRef } from 'react';

// Helper to calculate age from dob (YYYY-MM-DD)
export function getAgeFromDob(dob) {
  if (!dob) return '';
  const dobDate = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - dobDate.getFullYear();
  let months = now.getMonth() - dobDate.getMonth();
  let days = now.getDate() - dobDate.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return '';
  let ageStr = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : '';
  if (months > 0) ageStr += (ageStr ? ', ' : '') + `${months} month${months > 1 ? 's' : ''}`;
  return ageStr || 'Less than 1 month';
}
import ThemeSpinner from '../ThemeSpinner';
import heic2any from 'heic2any';
import { apiFetch } from '../api';
import ModalClose from '../ModalClose';


export default function AddPetWizardModal({ open, onClose, onNext, previousVetInfo, wizardData, householdId, onDraftSave }) {
        // Validation state
        const [validationError, setValidationError] = useState('');
        const [triedNext, setTriedNext] = useState(false);

        // Validation logic for each step
        const isStepValid = () => {
          if (step === 2) {
            // General info: petName, dob, species, breed, weight
            if (!form.petName || !form.dob || !form.species || !form.breed || !form.weight) return false;
            return true;
          }
          if (step === 3) {
            // Vet info: not required
            return true;
          }
          if (step === 4) {
            // Food: not required
            return true;
          }
          if (step === 5) {
            // Avatar: not required
            return true;
          }
          return true;
        };
      // Handler for selecting a breed from suggestions
      const chooseBreed = (breed) => {
        setForm((prev) => ({ ...prev, breed }));
        setShowBreedSuggestions(false);
        setFocusedSuggestion(-1);
      };
    // Ref for breed suggestions dropdown
    const suggestionsRef = useRef(null);
  // Advance to next step or finish
  const [finishing, setFinishing] = useState(false);
  const handleNext = async () => {
    setTriedNext(true);
    setValidationError('');
    if (!isStepValid()) {
      setValidationError('Please fill in all required fields before continuing.');
      return;
    }
    setTriedNext(false);
    if (step < 5) {
      setStep(step + 1);
    } else {
      setFinishing(true);
      const pet = await createPet();
      setFinishing(false);
      if (onNext && pet) onNext(pet);
      onClose();
    }
  };

  // If resuming a draft, start at the correct step and prefill form
  const initialForm = wizardData && wizardData.resumeDraft ? {
    petName: wizardData.name || '',
    dob: wizardData.dob || '',
    species: wizardData.species || 'dog',
    breed: wizardData.breed || '',
    weight: wizardData.weight || '',
    weightUnit: wizardData.weightUnit || 'kg',
    vetName: wizardData.vetName || previousVetInfo?.vetName || '',
    vetLocation: wizardData.vetLocation || previousVetInfo?.vetLocation || '',
    vetContact: wizardData.vetContact || previousVetInfo?.vetContact || '',
    primaryFood: wizardData.primaryFood || '',
    avatar: null,
    // Add more fields as needed
  } : {
    petName: '',
    dob: '',
    species: 'dog',
    breed: '',
    weight: '',
    weightUnit: 'kg',
    vetName: previousVetInfo?.vetName || '',
    vetLocation: previousVetInfo?.vetLocation || '',
    vetContact: previousVetInfo?.vetContact || '',
    primaryFood: '',
    avatar: null,
  };
  const [form, setForm] = useState(initialForm);

  // Fetch breed list based on species
  useEffect(() => {
    const species = form.species || 'dog';
    const storageKey = `petSitter:breeds:${species}`;
    const capitalizeWords = (s) =>
      s.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
    const setList = (list) => {
      setBreedsList(list);
      try {
        localStorage.setItem(storageKey, JSON.stringify(list));
      } catch (err) {}
    };
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        setBreedsList(JSON.parse(cached));
        return;
      }
    } catch (err) {}
    if (species === 'dog') {
      fetch('https://dog.ceo/api/breeds/list/all')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.message) {
            const breeds = Object.entries(data.message)
              .flatMap(([b, subs]) => {
                if (Array.isArray(subs) && subs.length) {
                  return subs.map((sub) => capitalizeWords(`${sub} ${b}`));
                }
                return capitalizeWords(b);
              })
              .sort((a, z) => a.localeCompare(z));
            setList(breeds);
          }
        })
        .catch(() => {});
      return;
    }
    if (species === 'cat') {
      fetch('https://api.thecatapi.com/v1/breeds')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const breeds = data.map((b) => capitalizeWords(b.name)).sort((a, z) => a.localeCompare(z));
            setList(breeds);
          }
        })
        .catch(() => {});
      return;
    }
    if (species === 'bird') {
      const birds = [
        'Budgerigar', 'Cockatiel', 'Cockatoo', 'Macaw', 'Conure', 'Lovebird', 'Finch', 'Canary', 'African Grey', 'Parakeet',
      ];
      setList(birds.sort((a, z) => a.localeCompare(z)));
      return;
    }
    setBreedsList([]);
  }, [form.species]);
          // --- Breed autocomplete input handler ---
          const updateBreedInput = (value) => {
            setForm((prev) => ({ ...prev, breed: value }));
            setFocusedSuggestion(-1);
            if (!value) {
              setBreedSuggestions([]);
              setShowBreedSuggestions(false);
              return;
            }
            const q = value.toLowerCase();
            const matches = breedsList.filter((b) => b.toLowerCase().includes(q)).slice(0, 8);
            setBreedSuggestions(matches);
            setShowBreedSuggestions(matches.length > 0);
          };
        // --- Breed autocomplete state ---
        const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
        const [breedSuggestions, setBreedSuggestions] = useState([]);
        const [breedsList, setBreedsList] = useState([]);
        const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
      // --- Breed autocomplete keydown handler ---
      const handleBreedKeyDown = (e) => {
        if (!showBreedSuggestions || breedSuggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedSuggestion((prev) => {
            const next = Math.min(prev + 1, breedSuggestions.length - 1);
            const el = document.getElementById(`wizard-breed-suggestion-${next}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
            return next;
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedSuggestion((prev) => {
            const next = Math.max(prev - 1, 0);
            const el = document.getElementById(`wizard-breed-suggestion-${next}`);
            if (el) el.scrollIntoView({ block: 'nearest' });
            return next;
          });
        } else if (e.key === 'Enter') {
          if (focusedSuggestion >= 0 && focusedSuggestion < breedSuggestions.length) {
            e.preventDefault();
            chooseBreed(breedSuggestions[focusedSuggestion]);
          }
        } else if (e.key === 'Escape') {
          setShowBreedSuggestions(false);
          setFocusedSuggestion(-1);
        }
      };
    // Ref for breed input (for autocomplete/focus)
    const breedInputRef = useRef(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const prevAvatarUrl = useRef(null);
  const [step, setStep] = useState(wizardData && wizardData.resumeDraft ? 2 : 1);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  // Finalize pet (draft: false)
  const createPet = async () => {
    try {
      const hid = householdId || wizardData?.householdId || wizardData?.household_id || window.householdId;
      if (!hid) {
        alert('No household ID found for creating pet.');
        return null;
      }
      const payload = {
        name: form.petName,
        dob: form.dob,
        species: form.species,
        breed: form.breed,
        weight: form.weight,
        weightUnit: form.weightUnit,
        vetName: form.vetName,
        vetLocation: form.vetLocation,
        vetContact: form.vetContact,
        primaryFood: form.primaryFood,
        photoUrl: null,
        notes: form.notes,
        draft: false
      };
      let pet;
      if (wizardData && wizardData.resumeDraft && wizardData.id) {
        // Update draft to finalized
        pet = await apiFetch(`/api/pets/${wizardData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        // Create new pet
        pet = await apiFetch(`/api/households/${hid}/pets`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      // If avatar file is selected, upload it
      if (pet && form.avatar) {
        try {
          const formData = new FormData();
          formData.append('photo', form.avatar);
          const uploadUrl = `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/pets/${pet.id}/photo`;
          const token = localStorage.getItem('token');
          const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
          });
          const text = await response.text();
          // handle response if needed
        } catch (err) {
          console.error('Failed to upload avatar:', err);
        }
      }
      return pet;
    } catch (err) {
      console.error('Failed to create pet:', err);
      alert('Failed to create pet: ' + (err?.error || err?.message || err));
      return null;
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    console.log('[AddPetWizard] handleAvatarChange', file);
    if (file) {
      // Reset input value so the same file can be selected again
      e.target.value = '';
      setForm((prev) => ({ ...prev, avatar: file }));
    }
  };

  // Update avatar preview when avatar changes
  useEffect(() => {
    let cancelled = false;
    async function updatePreview() {
      if (form.avatar) {
        if (form.avatar.type === 'image/heic' || form.avatar.name?.toLowerCase().endsWith('.heic')) {
          try {
            const blob = await heic2any({ blob: form.avatar, toType: 'image/jpeg', quality: 0.9 });
            if (cancelled) return;
            const url = URL.createObjectURL(blob);
            setAvatarPreview(url);
            if (prevAvatarUrl.current) URL.revokeObjectURL(prevAvatarUrl.current);
            prevAvatarUrl.current = url;
          } catch (err) {
            console.error('HEIC conversion failed:', err);
            setAvatarPreview(null);
          }
        } else {
          const url = URL.createObjectURL(form.avatar);
          setAvatarPreview(url);
          if (prevAvatarUrl.current) URL.revokeObjectURL(prevAvatarUrl.current);
          prevAvatarUrl.current = url;
        }
      } else {
        setAvatarPreview(null);
        if (prevAvatarUrl.current) {
          URL.revokeObjectURL(prevAvatarUrl.current);
          prevAvatarUrl.current = null;
        }
      }
    }
    updatePreview();
    return () => {
      cancelled = true;
      if (prevAvatarUrl.current) {
        URL.revokeObjectURL(prevAvatarUrl.current);
        prevAvatarUrl.current = null;
      }
    };
  }, [form.avatar]);

  const handleSkipAvatar = () => {
    setForm((prev) => ({ ...prev, avatar: null }));
    handleNext();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };


  // Save draft to backend
  const saveDraft = async () => {
    try {
      const hid = householdId || wizardData?.householdId || wizardData?.household_id || window.householdId;
      if (!hid) {
        alert('No household ID found for saving draft.');
        return;
      }
      const payload = {
        name: form.petName,
        dob: form.dob,
        species: form.species,
        breed: form.breed,
        weight: form.weight,
        weightUnit: form.weightUnit,
        vetName: form.vetName,
        vetLocation: form.vetLocation,
        vetContact: form.vetContact,
        primaryFood: form.primaryFood,
        photoUrl: null,
        notes: form.notes,
        draft: true
      };
      let pet;
      if (wizardData && wizardData.resumeDraft && wizardData.id) {
        // Update existing draft
        pet = await apiFetch(`/api/pets/${wizardData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        // Create new draft
        pet = await apiFetch(`/api/households/${hid}/pets`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      if (onDraftSave && pet) {
        onDraftSave(pet);
      }
    } catch (err) {
      alert('Failed to save draft: ' + (err?.error || err?.message || err));
    }
  };

  // Handle close (X) button
  const handleRequestClose = (e) => {
    e.preventDefault();
    setShowCloseConfirm(true);
  };

  const handleDiscard = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const handleSaveDraftAndClose = async () => {
    await saveDraft();
    setShowCloseConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-xl shadow-2xl w-full mx-2 sm:mx-4 relative animate-fade-in"
        style={{
          maxWidth: '95vw',
          width: '100%',
          padding: '1.5rem 0.5rem 1.5rem 0.5rem',
          ...(window.innerWidth >= 640 ? { maxWidth: 420, padding: '2.5rem 2rem 2rem 2rem' } : {})
        }}
      >
        <ModalClose id="add-pet-wizard-close" onClick={handleRequestClose} className="absolute top-3 right-3 text-2xl font-bold focus:outline-none" />
              {/* Close confirmation modal */}
              {showCloseConfirm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-xl shadow-2xl max-w-xs w-full p-6 text-center">
                    <h3 className="text-lg font-semibold mb-3">Save as draft or discard?</h3>
                    <p className="text-gray-600 mb-6">Would you like to save your progress as a draft or discard this pet?</p>
                    <div className="flex gap-3 justify-center">
                      <button className="btn px-4 py-2 bg-gray-100 text-gray-700" onClick={handleDiscard}>Discard</button>
                      <button className="btn btn-red px-4 py-2" onClick={handleSaveDraftAndClose}>Save as Draft</button>
                    </div>
                  </div>
                </div>
              )}
        <div className="flex flex-col items-center p-4 pt-2 w-full">
          <div className="flex items-center justify-center mb-2 w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-0">
              {step === 1 ? 'Add a New Pet' : step === 2 ? 'General Information' : step === 3 ? 'Vet Information' : 'Next Step'}
            </h2>
          </div>
          <img
            src="/create-pet-food.png"
            alt="Add Pet Wizard"
            style={{
              width: '420px',
              maxWidth: '100%',
              height: '200px',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              margin: '-20px 0 0 70px',
              borderRadius: 0,
              boxShadow: 'none'
            }}
          />
          {step === 1 && (
            <div className="w-full mt-4 text-center">
              <p className="text-base text-gray-700 mb-4">
                Welcome! This wizard will guide you through adding a new pet to your household.<br/>
                You’ll enter general info, vet details, food preferences, and more. Click Next to begin.
              </p>
            </div>
          )}
          {step === 2 && (
            <form className="w-full mt-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Pet Name *</label>
                <input
                  type="text"
                  name="petName"
                  value={form.petName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Date of Birth (approx) *</label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
                {form.dob && (
                  <div className="text-gray-600 text-sm mt-1">Age: {getAgeFromDob(form.dob)}</div>
                )}
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Species *</label>
                <select
                  name="species"
                  value={form.species}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                  required
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Breed *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="breed"
                    ref={breedInputRef}
                    value={form.breed}
                    onChange={e => updateBreedInput(e.target.value)}
                    onKeyDown={handleBreedKeyDown}
                    onFocus={() => {
                      console.log('[onFocus] breedsList.length:', breedsList.length, 'form.breed:', form.breed);
                      if (breedsList.length && form.breed) {
                        updateBreedInput(form.breed);
                      } else if (breedsList.length && !form.breed) {
                        setBreedSuggestions(breedsList.slice(0, 8));
                        setShowBreedSuggestions(true);
                        console.log('[onFocus] showing top 8 breeds:', breedsList.slice(0, 8));
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowBreedSuggestions(false), 150)}
                    placeholder="Start typing to find your breed..."
                    className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                    required
                  />
                  {showBreedSuggestions && (
                    !breedsList.length ? (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow z-50 px-3 py-2 text-sm text-gray-500">Loading breeds...</div>
                    ) : (
                      <ul
                        role="listbox"
                        aria-label="Breed suggestions"
                        className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-gray-200 rounded shadow z-50"
                        ref={suggestionsRef}
                      >
                        {breedSuggestions.map((b, i) => {
                          const isFocused = i === focusedSuggestion;
                          return (
                            <li
                              id={`wizard-breed-suggestion-${i}`}
                              key={b}
                              role="option"
                              aria-selected={isFocused}
                              className={`px-3 py-2 cursor-pointer text-sm ${isFocused ? 'btn' : 'hover:bg-gray-100'}`}
                              onMouseDown={ev => {
                                ev.preventDefault();
                                chooseBreed(b);
                              }}
                            >
                              {b}
                            </li>
                          );
                        })}
                      </ul>
                    )
                  )}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Weight *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="weight"
                    value={form.weight}
                    onChange={handleChange}
                    className="w-2/3 px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                    min="0"
                    step="0.1"
                    required
                  />
                  <select
                    name="weightUnit"
                    value={form.weightUnit}
                    onChange={handleChange}
                    className="w-1/3 px-2 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none bg-white"
                  >
                    <option value="kg">Kg</option>
                    <option value="lbs">Lbs</option>
                  </select>
                </div>
              </div>
            </form>
          )}
          {step === 3 && (
            <form className="w-full mt-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Vet Name</label>
                <input
                  type="text"
                  name="vetName"
                  value={form.vetName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                  placeholder="e.g., Dr. Smith or Happy Paws Vet"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Vet Location</label>
                <input
                  type="text"
                  name="vetLocation"
                  value={form.vetLocation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                  placeholder="Address, clinic name, or postcode"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Vet Contact</label>
                <input
                  type="tel"
                  name="vetContact"
                  value={form.vetContact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                  placeholder="Phone number"
                />
              </div>
            </form>
          )}
          {step === 4 && (
            <form className="w-full mt-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1">Primary Food (optional)</label>
                <input
                  type="text"
                  name="primaryFood"
                  value={form.primaryFood}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                  placeholder="e.g., Kibble, Wet food, Raw"
                />
              </div>
            </form>
          )}
          {step === 5 && (
            <form className="w-full mt-4 flex flex-col items-center relative">
              {finishing && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 rounded-xl">
                  <ThemeSpinner label="Adding pet..." />
                </div>
              )}
              <label className="block text-sm font-medium text-gray-900 mb-2 text-center w-full">Pet Avatar <span className="text-gray-400 text-xs ml-1">(Optional)</span></label>
              <div className="mb-4 flex flex-col items-center">
                <div className="relative">
                  <input
                    key={form.avatar ? form.avatar.name + form.avatar.size : 'empty'}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 w-32 h-32 opacity-0 cursor-pointer z-10"
                    style={{ borderRadius: '1rem' }}
                    id="pet-avatar-upload"
                    aria-label="Pet Avatar File Input"
                  />
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Pet Avatar Preview"
                      className="w-32 h-32 object-cover rounded-full border"
                      onLoad={() => console.log('[AddPetWizard] Avatar preview loaded', avatarPreview)}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-gray-200 border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                      <span className="text-gray-400 text-4xl select-none" role="img" aria-label="Camera">📷</span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
          {triedNext && validationError && (
            <div className="w-full text-center text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 mb-2 animate-pulse" style={{fontSize:'0.97em'}}>
              <span role="img" aria-label="Warning" style={{marginRight:4}}>⚠️</span>{validationError}
            </div>
          )}
          <div className="flex items-center justify-between w-full mt-8" style={{ minHeight: 44 }}>
            <button
              className="btn px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded shadow-none hover:bg-gray-200 transition disabled:opacity-50 cursor-pointer"
              style={{ minWidth: 44, cursor: 'pointer' }}
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </button>
            <span className="text-gray-500 text-sm font-medium select-none">Step {step} of 5</span>
            <button
              className="btn btn-red px-2 py-1 text-xs font-medium transition-opacity duration-300 opacity-100 cursor-pointer"
              style={{ minWidth: 44, cursor: 'pointer' }}
              onClick={handleNext}
              type="button"
            >
              {step < 5 ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
}
