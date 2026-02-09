import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiUrl } from './api';

// Move FoodWizardModal above PetFood so it is defined before use
function FoodWizardModal({ petId, petName, onClose, onComplete, initialData }) {
  const [form, setForm] = useState(() => initialData || {
    foodTypes: [], brands: {}, foods: {}, units: {}, weights: {}, bagFullness: {}, mealFrequencies: {}
  });
  const [step, setStep] = useState(0);

  const FOOD_TYPE_OPTIONS = [
  
  // fullnessMap must be inside the FoodWizardModal, not at top-level
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
                  required
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
          <div className="mb-4">Select a brand for each food type:</div>
          <div className="flex flex-col gap-4">
            {form.foodTypes.length === 0 && <div className="text-sm text-gray-500">No food types selected.</div>}
            {form.foodTypes.map(type => (
              <div key={type} className="flex flex-col gap-1">
                <label className="font-medium">{FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type}</label>
                <select
                  className="select select-bordered"
                  value={form.brands[type] || ''}
                  onChange={e => {
                    const brand = e.target.value;
                    setForm(f => ({
                      ...f,
                      brands: { ...f.brands, [type]: brand },
                      foods: { ...f.foods, [type]: '' }
                    }));
                  }}
                  required
                >
                  <option value="" disabled>Select brand...</option>
                  {BRAND_OPTIONS[type]?.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      label: 'Select the specific food for each brand/type',
      content: (
        <div>
          <div className="mb-4">Select a specific food for each brand/type:</div>
          <div className="flex flex-col gap-4">
            {form.foodTypes.length === 0 && <div className="text-sm text-gray-500">No food types selected.</div>}
            {form.foodTypes.map(type => {
              const brand = form.brands[type];
              if (!brand) return (
                <div key={type} className="text-sm text-gray-400">No brand selected for {FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type}.</div>
              );
              const foodList = FOOD_OPTIONS[brand] || ['Other'];
              return (
                <div key={type} className="flex flex-col gap-1">
                  <label className="font-medium">{brand} ({FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type})</label>
                  <select
                    className="select select-bordered"
                    value={form.foods[type] || ''}
                    onChange={e => {
                      const food = e.target.value;
                      setForm(f => ({
                        ...f,
                        foods: { ...f.foods, [type]: food }
                      }));
                    }}
                    required
                  >
                    <option value="" disabled>Select food...</option>
                    {foodList.map(food => (
                      <option key={food} value={food}>{food}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      label: 'Enter your current stock for each food type',
      content: (
        <div className="flex flex-col gap-6">
          {form.foodTypes.length === 0 && <div className="text-sm text-gray-500">No food types selected.</div>}
          {form.foodTypes.map(type => (
            <div key={type} className="flex flex-col gap-2 p-2 border rounded-md">
              <label className="font-medium text-base">{FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type}</label>
              <label className="text-sm">How many full bags/units do you currently have? (e.g. 3, 10, etc.)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="input input-bordered w-full"
                placeholder="e.g. 5"
                value={form.units[type] || ''}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, units: { ...f.units, [type]: val } }));
                }}
                required
              />
              <label className="text-sm mt-2">What is the weight of a full bag/unit? (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="input input-bordered w-full"
                placeholder="e.g. 5"
                value={form.weights[type] || ''}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, weights: { ...f.weights, [type]: val } }));
                }}
                required
              />
              <label className="text-sm mt-2">How full is your current open bag?</label>
              <select
                className="select select-bordered"
                value={form.bagFullness[type] || ''}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, bagFullness: { ...f.bagFullness, [type]: val } }));
                }}
                required
              >
                <option value="" disabled>Select fullness...</option>
                <option value="none">No open bags</option>
                <option value="full">Full</option>
                <option value="three-quarters">3/4 Full</option>
                <option value="half">Half</option>
                <option value="quarter">1/4 Full</option>
              </select>
            </div>
          ))}
        </div>
      )
    },
    {
      label: 'How many meals per day for each food?',
      content: (
        <div className="flex flex-col gap-4">
          {form.foodTypes.length === 0 && <div className="text-sm text-gray-500">No food types selected.</div>}
          {form.foodTypes.map(type => (
            <div key={type} className="flex flex-col gap-1">
              <label className="font-medium">{FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type} meals per day</label>
              <input
                type="number"
                min="1"
                step="1"
                className="input input-bordered w-full"
                placeholder="e.g. 2"
                value={form.mealFrequencies[type] || ''}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, mealFrequencies: { ...f.mealFrequencies, [type]: val } }));
                }}
                required
              />
            </div>
          ))}
        </div>
      )
    }
  ];

  // Validation for each step
  function isStepValid() {
    if (step === 0) {
      // Must select at least one food type
      return form.foodTypes && form.foodTypes.length > 0;
    }
    if (step === 1) {
      // Must select a brand for each food type
      return form.foodTypes.every(type => form.brands[type]);
    }
    if (step === 2) {
      // Must select a food for each type
      return form.foodTypes.every(type => form.foods[type]);
    }
    if (step === 3) {
      // Must fill all stock fields for each type
      return form.foodTypes.every(type =>
        form.units[type] && form.weights[type] && form.bagFullness[type]
      );
    }
    if (step === 4) {
      // Must fill meal frequency for each type
      return form.foodTypes.every(type => form.mealFrequencies[type]);
    }
    return true;
  }

  async function next() {
    if (!isStepValid()) return;
    if (step < steps.length - 1) setStep(step + 1);
    else {
      // Persist food data to backend
      try {
        await fetch(apiUrl(`/api/pets/${petId}/food`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
          body: JSON.stringify(form)
        });
      } catch (e) {
        // Optionally show error
      }
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
        <button className="btn cursor-pointer" onClick={onClose}>Cancel</button>
        <div>
          {step > 0 && <button className="btn mr-2 cursor-pointer" onClick={prev}>Back</button>}
          <button
            className={`btn btn-accent cursor-pointer${!isStepValid() ? ' opacity-50 cursor-not-allowed' : ''}`}
            onClick={next}
            disabled={!isStepValid()}
          >
            {step === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PetFood() {
  // Removed duplicate useEffect that referenced petId before declaration
  const { petId } = useParams();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  

  useEffect(() => {
    async function fetchFood() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/pets/${petId}/food`), {
          headers: localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}
        });
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
      ) : (
        <>
          {food ? (
            <div className="space-y-8">
              {food.foodTypes && food.foodTypes.length > 0 ? (
                food.foodTypes.map(type => {
                  const units = parseInt(food.units && food.units[type] ? food.units[type] : 0, 10) || 0;
                  const fullnessMap = {
                    'none': 0,
                    'full': 100,
                    'three-quarters': 75,
                    'half': 50,
                    'quarter': 25
                  };
                  const openBagFullness = food.bagFullness && food.bagFullness[type] ? fullnessMap[food.bagFullness[type]] || 0 : 0;
                  let bars = [];
                  if (units > 0) {
                    if (openBagFullness > 0 && openBagFullness < 100) {
                      bars.push(openBagFullness);
                      for (let i = 0; i < units - 1; i++) {
                        bars.push(100);
                      }
                    } else {
                      for (let i = 0; i < units; i++) {
                        bars.push(100);
                      }
                    }
                  } else if (openBagFullness > 0) {
                    bars.push(openBagFullness);
                  }
                  return (
                    <div key={type} className="border-b pb-4 mb-4 flex flex-row items-stretch">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                        <div className="ml-4 space-y-1">
                          <div><b>Brand:</b> {food.brands && food.brands[type] ? food.brands[type] : '-'}</div>
                          <div><b>Specific Food:</b> {food.foods && food.foods[type] ? food.foods[type] : '-'}</div>
                          <div><b>Stock:</b> {food.units && food.units[type] ? `${food.units[type]} full bags/units` : '-'}</div>
                          <div><b>Full Bag Weight:</b> {food.weights && food.weights[type] ? `${food.weights[type]} kg` : '-'}</div>
                          <div><b>Open Bag Fullness:</b> {food.bagFullness && food.bagFullness[type] ? food.bagFullness[type].replace('none','No open bags').replace('three-quarters','3/4').replace('quarter','1/4').replace('full','Full').replace('half','Half') : '-'}</div>
                          <div><b>Meal Frequency:</b> {food.mealFrequencies && food.mealFrequencies[type] ? `${food.mealFrequencies[type]} per day` : '-'}</div>
                          <div className="mt-2"><b>Stock Levels:</b></div>
                          <div className="flex flex-row gap-2 mt-1">
                            {(() => {
                              const units = parseInt(food.units && food.units[type] ? food.units[type] : 0, 10) || 0;
                              const fullnessMap = {
                                'full': 100,
                                'three-quarters': 75,
                                'half': 50,
                                'quarter': 25
                              };
                              const openBagFullness = food.bagFullness && food.bagFullness[type] ? fullnessMap[food.bagFullness[type]] || 0 : 0;
                              let bars = [];
                              if (units > 0) {
                                if (openBagFullness > 0 && openBagFullness < 100) {
                                  bars.push(openBagFullness);
                                  for (let i = 0; i < units - 1; i++) {
                                    bars.push(100);
                                  }
                                } else {
                                  for (let i = 0; i < units; i++) {
                                    bars.push(100);
                                  }
                                }
                              } else if (openBagFullness > 0) {
                                bars.push(openBagFullness);
                              }
                              // Render pills bottom-up by reversing the array
                              // Do NOT reverse the bars array; render as-is so open bag is leftmost
                              return bars.map((percent, idx) => {
                                let fillColor = 'bg-green-500';
                                if (percent <= 25) fillColor = 'bg-red-500';
                                else if (percent === 50) fillColor = 'bg-yellow-400';
                                // The first pill (idx === 0) is the current open bag if openBagFullness < 100
                                const isCurrentBag = idx === 0 && openBagFullness > 0 && openBagFullness < 100;
                                const isExtraStock = !isCurrentBag;
                                return (
                                  <span key={idx} className="relative flex flex-col items-center w-6">
                                    <span className="w-6 h-8 bg-gray-200 rounded overflow-hidden border border-gray-300 flex flex-col justify-end items-end my-0.5">
                                      <span
                                        className={`block w-full ${fillColor}`}
                                        style={{ height: percent + '%', minHeight: 0, transition: 'height 0.5s', alignSelf: 'flex-end' }}
                                        title={percent + '% full'}
                                      />
                                    </span>
                                    {isCurrentBag && (
                                      <span className="text-xs text-gray-700 mt-0.5">{percent}%</span>
                                    )}
                                    {isExtraStock && (
                                      <span className="text-xs text-gray-500 mt-0.5">extra stock</span>
                                    )}
                                  </span>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                       {/* Removed old side stock level pills. Pills now appear under 'Stock Levels:' label. */}
                    </div>
                  );
                })
              ) : (
                <span className="ml-2 text-gray-500">No food types selected.</span>
              )}
               <button className="btn btn-accent cursor-pointer" onClick={() => setShowModal(true)}>Edit Food</button>
            </div>
          ) : (
            <div>
              <div>No food data entered yet.</div>
              <button className="btn btn-accent mt-4 cursor-pointer" onClick={() => setShowModal(true)}>Add Food</button>
            </div>
          )}
        </>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative">
            <button className="absolute top-3 right-3 text-2xl font-bold text-gray-400 cursor-pointer" onClick={() => setShowModal(false)}>&times;</button>
            <FoodWizardModal petId={petId} petName={food?.petName || 'your pet'} onClose={() => setShowModal(false)} onComplete={setFood} initialData={food} />
          </div>
        </div>
      )}
    </div>
  );

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
          <div className="mb-4">Select a brand for each food type:</div>
          <div className="flex flex-col gap-4">
            {form.foodTypes.length === 0 && <div className="text-sm text-gray-500">No food types selected.</div>}
            {form.foodTypes.map(type => (
              <div key={type} className="flex flex-col gap-1">
                <label className="font-medium">{FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type}</label>
                <select
                  className="select select-bordered"
                  value={form.brands[type] || ''}
                  onChange={e => {
                    const brand = e.target.value;
                    setForm(f => ({
                      ...f,
                      brands: { ...f.brands, [type]: brand },
                      // Reset food selection for this type if brand changes
                      foods: { ...f.foods, [type]: '' }
                    }));
                  }}
                >
                  <option value="" disabled>Select brand...</option>
                  {BRAND_OPTIONS[type]?.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      label: 'Select the specific food for each brand/type',
      content: (
        <div>
          <div className="mb-4">Select a specific food for each brand/type:</div>
          <div className="flex flex-col gap-4">
            {form.foodTypes.length === 0 && <div className="text-sm text-gray-500">No food types selected.</div>}
            {form.foodTypes.map(type => {
              const brand = form.brands[type];
              if (!brand) return (
                <div key={type} className="text-sm text-gray-400">No brand selected for {FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type}.</div>
              );
              const foodList = FOOD_OPTIONS[brand] || ['Other'];
              return (
                <div key={type} className="flex flex-col gap-1">
                  <label className="font-medium">{brand} ({FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type})</label>
                  <select
                    className="select select-bordered"
                    value={form.foods[type] || ''}
                    onChange={e => {
                      const food = e.target.value;
                      setForm(f => ({
                        ...f,
                        foods: { ...f.foods, [type]: food }
                      }));
                    }}
                  >
                    <option value="" disabled>Select food...</option>
                    {foodList.map(food => (
                      <option key={food} value={food}>{food}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      label: 'Enter your current stock for each food type',
      content: (
        <div className="flex flex-col gap-6">
          {form.foodTypes.length === 0 && <div className="text-sm text-gray-500">No food types selected.</div>}
          {form.foodTypes.map(type => (
            <div key={type} className="flex flex-col gap-2 p-2 border rounded-md">
              <label className="font-medium text-base">{FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type}</label>
              <label className="text-sm">How many full bags/units do you currently have? (e.g. 3, 10, etc.)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="input input-bordered w-full"
                placeholder="e.g. 5"
                value={form.units[type] || ''}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, units: { ...f.units, [type]: val } }));
                }}
              />
              <label className="text-sm mt-2">What is the weight of a full bag/unit? (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="input input-bordered w-full"
                placeholder="e.g. 5"
                value={form.weights[type] || ''}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, weights: { ...f.weights, [type]: val } }));
                }}
              />
              <label className="text-sm mt-2">How full is your current open bag?</label>
              <select
                className="select select-bordered"
                value={form.bagFullness[type] || ''}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, bagFullness: { ...f.bagFullness, [type]: val } }));
                }}
              >
                <option value="" disabled>Select fullness...</option>
                <option value="full">Full</option>
                <option value="three-quarters">3/4 Full</option>
                <option value="half">Half</option>
                <option value="quarter">1/4 Full</option>
              </select>
            </div>
          ))}
        </div>
      )
    },
    {
      label: 'How many meals per day for each food?',
      content: (
        <div className="flex flex-col gap-4">
          {form.foodTypes.length === 0 && <div className="text-sm text-gray-500">No food types selected.</div>}
          {form.foodTypes.map(type => (
            <div key={type} className="flex flex-col gap-1">
              <label className="font-medium">{FOOD_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type} meals per day</label>
              <input
                type="number"
                min="1"
                step="1"
                className="input input-bordered w-full"
                placeholder="e.g. 2"
                value={form.mealFrequencies[type] || ''}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, mealFrequencies: { ...f.mealFrequencies, [type]: val } }));
                }}
              />
            </div>
          ))}
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

