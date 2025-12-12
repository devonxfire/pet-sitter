              // ...existing code...
import React, { useState, useEffect } from 'react';

export default function AddPetWizardModal({ open, onClose, onNext }) {
  const [showNext, setShowNext] = useState(false);

  useEffect(() => {
    if (open) {
      setShowNext(false);
      const timer = setTimeout(() => setShowNext(true), 2200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900 bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative animate-fade-in" style={{padding: '2.5rem 2rem 2rem 2rem'}}>
        <button
          id="add-pet-wizard-close"
          className="absolute top-3 right-3 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', backgroundColor: 'transparent', border: 'none', padding: 0, boxShadow: 'none', lineHeight: 1, color: '#e11d48', outline: 'none', cursor: 'pointer', WebkitTextStroke: '0', textShadow: 'none', filter: 'none', zIndex: 10, fontWeight: 700, fontSize: '2rem', position: 'absolute', right: '0.75rem', top: '0.75rem' }}
        >
          <span style={{ color: '#e11d48', background: 'none', border: 'none', boxShadow: 'none', textShadow: 'none', WebkitTextStroke: 0, filter: 'none' }}>×</span>
        </button>
        <div className="flex flex-col items-center p-4 pt-2 w-full">
          <div className="flex items-center justify-center mb-2 w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-0">Starting the Add Pet Wizard...</h2>
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
                margin: '-50px 0 0 70px', // shift even further up and right
                borderRadius: 0,
                boxShadow: 'none'
              }}
            />
          <p className="text-gray-500 text-sm mt-0 mb-0">
            Please answer the prompts as accurately as you can.<br />
            You can always change or update your information at any time.
          </p>
          <div className="flex items-center justify-between w-full mt-1" style={{ minHeight: 44 }}>
            <button
              className="btn px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded shadow-none hover:bg-gray-200 transition disabled:opacity-50"
              style={{ minWidth: 44 }}
              disabled
            >
              Back
            </button>
            <span className="text-gray-500 text-sm font-medium select-none">Step 1 of 1</span>
            <button
              className={`btn btn-red px-2 py-1 text-xs font-medium transition-opacity duration-300 ${showNext ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              style={{ minWidth: 44 }}
              disabled={!showNext}
              onClick={onNext}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
