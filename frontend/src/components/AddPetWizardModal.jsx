              // ...existing code...

import React, { useState } from 'react';

export default function AddPetWizardModal({ open, onClose, onNext }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    petName: '',
    age: '',
    species: 'dog',
    breed: '',
    // vetName, vetLocation, vetContact, primaryFood, notes, etc. for later steps
  });

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2); // placeholder for next step
    } else {
      onNext(form);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
        <button
          id="add-pet-wizard-close"
          className="absolute top-3 right-3 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', backgroundColor: 'transparent', border: 'none', padding: 0, boxShadow: 'none', lineHeight: 1, color: '#d1d5db', outline: 'none', cursor: 'pointer', WebkitTextStroke: '0', textShadow: 'none', filter: 'none', zIndex: 10, fontWeight: 400, fontSize: '1.8rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
        >
          <span style={{ color: '#d1d5db', background: 'none', border: 'none', boxShadow: 'none', textShadow: 'none', WebkitTextStroke: 0, filter: 'none', fontWeight: 300 }}>×</span>
        </button>
        <div className="flex flex-col items-center p-4 pt-2 w-full">
          <div className="flex items-center justify-center mb-2 w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-0">
              {step === 1 ? 'Add a New Pet' : step === 2 ? 'General Information' : 'Next Step'}
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
            </form>
          )}
          {/* Future: step === 3 for Vet Info, etc. */}
          <div className="flex items-center justify-between w-full mt-8" style={{ minHeight: 44 }}>
            <button
              className="btn px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded shadow-none hover:bg-gray-200 transition disabled:opacity-50"
              style={{ minWidth: 44 }}
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </button>
            <span className="text-gray-500 text-sm font-medium select-none">Step {step} of 2</span>
            <button
              className="btn btn-red px-2 py-1 text-xs font-medium transition-opacity duration-300 opacity-100"
              style={{ minWidth: 44 }}
              onClick={handleNext}
            >
              {step === 1 ? 'Next' : step === 2 ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
}
