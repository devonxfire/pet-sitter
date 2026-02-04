import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiUrl } from './api';

export default function PetFood() {
  const { petId } = useParams();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchFood() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/pets/${petId}/food`));
        if (res.ok) {
          const data = await res.json();
          setFood(data);
        } else {
          setFood(null);
        }
      } catch {
        setFood(null);
      }
      setLoading(false);
    }
    fetchFood();
  }, [petId]);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Food Inventory</h1>
      {loading ? (
        <div>Loading...</div>
      ) : food ? (
        <div className="space-y-4">
          <div><b>Food:</b> {food.name}</div>
          <div><b>Brand:</b> {food.brand}</div>
          <div><b>Amount:</b> {food.amountKg} kg</div>
          <div><b>Meal Frequency:</b> {food.mealFrequency} per day</div>
          <button className="btn btn-accent" onClick={() => setShowModal(true)}>Edit Food</button>
        </div>
      ) : (
        <div>
          <div>No food data entered yet.</div>
          <button className="btn btn-accent mt-4" onClick={() => setShowModal(true)}>Add Food</button>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
            <button className="absolute top-3 right-3 text-2xl font-bold text-gray-400" onClick={() => setShowModal(false)}>&times;</button>
            <WizardModal petName={food?.petName || 'your pet'} onClose={() => setShowModal(false)} onComplete={setFood} initialData={food} />
          </div>
        </div>
      )}
    </div>
  );
}

// Modal wizard component (moved outside main component)

function WizardModal({ petName, onClose, onComplete, initialData }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    foodTypes: [],
    brands: [],
    foods: [],
    weight: '',
    mealFrequency: '',
    ...initialData
  });

  // Dummy data for dropdowns
  const FOOD_TYPE_OPTIONS = [
    { value: 'pellets', label: 'Pellets' },
    { value: 'raw', label: 'Raw' },
    { value: 'wet', label: 'Wet Food' },
    { value: 'other', label: 'Other' }
  ];
  const BRAND_OPTIONS = {
    pellets: ['Royal Canin', 'Eukanuba', 'Hills', 'Acana'],
    raw: ['Raw Love', 'Doggy Dinners', 'Barf'],
    wet: ['Hill’s Science', 'Pedigree', 'Cesar'],
    other: ['Homemade', 'Prescription', 'Other']
  };
  const FOOD_OPTIONS = {
    'Royal Canin': ['Mobility', 'Digestive', 'Puppy'],
    'Eukanuba': ['Skin', 'Weight Control'],
    'Hills': ['Metabolic', 'Dental'],
    'Acana': ['Grasslands', 'Wild Prairie'],
    'Raw Love': ['Chicken', 'Beef'],
    'Doggy Dinners': ['Lamb', 'Turkey'],
    'Barf': ['Classic', 'Sport'],
    'Hill’s Science': ['Adult', 'Puppy'],
    'Pedigree': ['Chopped', 'Gravy'],
    'Cesar': ['Filet Mignon', 'Porterhouse'],
    'Homemade': ['Custom'],
    'Prescription': ['Renal', 'Hepatic'],
    'Other': ['Other']
  };

  // Multi-select handler for food types
  function handleFoodTypeChange(e) {
    const { value, checked } = e.target;
    setForm(f => {
      let foodTypes = f.foodTypes || [];
      if (checked) {
        foodTypes = [...foodTypes, value];
      } else {
        foodTypes = foodTypes.filter(t => t !== value);
      }
      return { ...f, foodTypes };
    });
  }

  const steps = [
    {
      label: `Please select the type of food ${petName} eats on a daily basis`,
      content: (
        <div>
          <div className="mb-4">Select all that apply:</div>
          <div className="flex flex-col gap-2">
            {FOOD_TYPE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={form.foodTypes.includes(opt.value)}
                  onChange={handleFoodTypeChange}
                  className="checkbox"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )
    },
    {
      label: 'Select the brand for each food type',
      content: (
        <div>
          <div className="mb-4">Brand selection for each type (dynamic)</div>
          {/* TODO: Implement brand dropdowns per selected food type */}
        </div>
      )
    },
    {
      label: 'Select the specific food for each brand/type',
      content: (
        <div>
          <div className="mb-4">Specific food selection (dynamic)</div>
          {/* TODO: Implement food dropdowns per selected brand/type */}
        </div>
      )
    },
    {
      label: 'Enter the weight of the food (kg)',
      content: (
        <div>
          <input type="number" min="0" step="0.1" className="input input-bordered w-full" placeholder="e.g. 5" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
        </div>
      )
    },
    {
      label: 'How many meals per day?',
      content: (
        <div>
          <input type="number" min="1" step="1" className="input input-bordered w-full" placeholder="e.g. 2" value={form.mealFrequency} onChange={e => setForm(f => ({ ...f, mealFrequency: e.target.value }))} />
        </div>
      )
    }
  ];

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      onComplete(form);
      onClose();
    }
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{steps[step].label}</h2>
      <div className="mb-6">{steps[step].content}</div>
      <div className="flex justify-between">
        <button className="btn" onClick={onClose}>Cancel</button>
        <div>
          {step > 0 && <button className="btn mr-2" onClick={prev}>Back</button>}
          <button className="btn btn-accent" onClick={next}>{step === steps.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}

