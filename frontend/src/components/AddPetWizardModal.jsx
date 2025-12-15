              // ...existing code...

import React, { useState, useEffect, useRef } from 'react';
import heic2any from 'heic2any';
import { apiFetch } from '../api';



export default function AddPetWizardModal({ open, onClose, onNext, previousVetInfo, wizardData, householdId, onDraftSave }) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  // If resuming a draft, start at the correct step and prefill form
  const initialForm = wizardData && wizardData.resumeDraft ? {
    petName: wizardData.name || '',
    age: wizardData.age || '',
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
    age: '',
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
        return;
      }
      const payload = {
        name: form.petName,
        age: form.age,
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
          let data;
          try {
            data = text ? JSON.parse(text) : {};
          } catch (parseErr) {
            throw new Error(text || 'Failed to upload photo');
          }
          if (!response.ok) {
            throw new Error(data?.error || 'Failed to upload photo');
          }
          pet = data;
        } catch (err) {
          alert('Failed to upload avatar: ' + (err?.error || err?.message || err));
        }
      }

      if (onNext && pet) {
        onNext(pet);
      }
    } catch (err) {
      alert('Failed to add pet: ' + (err?.error || err?.message || err));
    }
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
    } else {
      createPet();
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
        age: form.age,
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
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
        <button
          id="add-pet-wizard-close"
          className="absolute top-3 right-3 text-2xl font-bold focus:outline-none"
          onClick={handleRequestClose}
          aria-label="Close"
          style={{ background: 'none', backgroundColor: 'transparent', border: 'none', padding: 0, boxShadow: 'none', lineHeight: 1, color: '#d1d5db', outline: 'none', cursor: 'pointer', WebkitTextStroke: '0', textShadow: 'none', filter: 'none', zIndex: 10, fontWeight: 400, fontSize: '1.8rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
        >
          <span style={{ color: '#d1d5db', background: 'none', border: 'none', boxShadow: 'none', textShadow: 'none', WebkitTextStroke: 0, filter: 'none', fontWeight: 300 }}>×</span>
        </button>
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
                <label className="block text-sm font-medium text-gray-900 mb-1">Age *</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                  min="0"
                  required
                />
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
                <input
                  type="text"
                  name="breed"
                  value={form.breed}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-gray-200 focus:border-accent focus:outline-none"
                  required
                />
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
            <form className="w-full mt-4 flex flex-col items-center">
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
          <div className="flex items-center justify-between w-full mt-8" style={{ minHeight: 44 }}>
            <button
              className="btn px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded shadow-none hover:bg-gray-200 transition disabled:opacity-50"
              style={{ minWidth: 44 }}
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </button>
            <span className="text-gray-500 text-sm font-medium select-none">Step {step} of 5</span>
            <button
              className="btn btn-red px-2 py-1 text-xs font-medium transition-opacity duration-300 opacity-100"
              style={{ minWidth: 44 }}
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
