import React, { useEffect, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { apiUrl, apiFetch } from './api';
import kibbleIcon from './icons/kibble.svg';
import wetFoodIcon from './icons/wetfood.svg';
import rawIcon from './icons/raw.svg';
import otherFoodIcon from './icons/otherfood.svg';

// Demo food type icon mapping (as image src)
const FOOD_TYPE_ICONS = {
  pellets: kibbleIcon,
  kibble: kibbleIcon,
  wet: wetFoodIcon,
  raw: rawIcon,
  other: otherFoodIcon,
};

// Demo pet list (replace with real data/fetch in future)
const DEMO_PETS = [
  { id: 1, name: 'Buddy', species: 'dog' },
  { id: 2, name: 'Mittens', species: 'cat' },
];

// Food type options and brand options by type
const FOOD_TYPE_OPTIONS = [
  { value: '', label: 'Select type' },
  { value: 'pellets', label: 'Pellets' },
  { value: 'kibble', label: 'Kibble' },
  { value: 'wet', label: 'Wet Food' },
  { value: 'raw', label: 'Raw Food' },
  { value: 'other', label: 'Other' },
];

const BRAND_OPTIONS = {
  pellets: [ '', 'Eukanuba Mobility', 'Pedigree Coat', 'Montego Karoo', 'Royal Canin Maxi' ],
  kibble: [ '', 'Acana', 'Orijen', 'Hills Science Diet', 'Montego Classic' ],
  wet: [ '', 'Hill’s Prescription Diet', 'Royal Canin Instinctive', 'Weruva', 'Feline Natural' ],
  raw: [ '', 'Instinct Raw', 'Stella & Chewy’s', 'Primal', 'Homemade' ],
  other: [ '', 'Custom/Other' ]
};

export default function FoodInventoryManager({ householdId }) {
  const [inventory, setInventory] = useState([]);
  const [member, setMember] = useState(null); // null = not a member, object = member
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState({ foodType: '', brand: '', other: '', totalStock: '', weightKg: '', unitPerServing: '', unitPerServingType: 'g', openBag: false, openBagFullness: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState(null);
  // Demo: food-to-pet linking state (UI only)
  const [foodPetLinks, setFoodPetLinks] = useState({}); // { foodId: [petId, ...] }

  useEffect(() => {
    if (!householdId) return;
    setLoading(true);
    apiFetch(`/api/households/${householdId}/food-inventory`)
      .then(data => {
        // New API: { inventory, member }
        if (data && Array.isArray(data.inventory)) {
          setInventory(data.inventory);
          setMember(data.member || null);
          setError('');
        } else if (Array.isArray(data)) { // fallback for old API
          setInventory(data);
          setMember(null);
          setError('');
        } else {
          setInventory([]);
          setMember(null);
          if (data && data.error) setError(data.error);
          else setError('No inventory data or unauthorized.');
        }
      })
      .catch(e => {
        if (e.message && e.message.toLowerCase().includes('auth')) setError('You are not authorized to view this household inventory. Please log in.');
        else setError('Failed to load inventory');
        setInventory([]);
        setMember(null);
      })
      .finally(() => setLoading(false));
  }, [householdId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch(`/api/households/${householdId}/food-inventory`, {
        method: 'POST',
        body: JSON.stringify({ ...newItem, totalStock: parseFloat(newItem.totalStock) })
      });
      setNewItem({ foodType: '', brand: '', other: '', totalStock: '', weightKg: '', unitPerServing: '', unitPerServingType: 'g', openBag: false, openBagFullness: '' });
      // Refetch inventory and member
      const data = await apiFetch(`/api/households/${householdId}/food-inventory`);
      setInventory(data.inventory || []);
      setMember(data.member || null);
    } catch {
      setError('Failed to add item');
    }
  };

  const handleEditFields = async (id) => {
    setError('');
    try {
      await apiFetch(`/api/food-inventory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          foodType: editFields.foodType,
          brand: editFields.brand,
          other: editFields.other,
          totalStock: parseFloat(editFields.totalStock),
          weightKg: parseFloat(editFields.weightKg),
          unitPerServing: parseFloat(editFields.unitPerServing),
          unitPerServingType: editFields.unitPerServingType,
          openBag: !!editFields.openBag,
          openBagFullness: editFields.openBagFullness
        })
      });
      setEditingId(null);
      setEditFields(null);
      // Refetch inventory and member
      const data = await apiFetch(`/api/households/${householdId}/food-inventory`);
      setInventory(data.inventory || []);
      setMember(data.member || null);
    } catch {
      setError('Failed to update item');
    }
  };

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const handleDeleteItem = async (id) => {
    setError('');
    setDeleteLoading(true);
    try {
      await apiFetch(`/api/food-inventory/${id}`, {
        method: 'DELETE'
      });
      // Refetch inventory and member
      const data = await apiFetch(`/api/households/${householdId}/food-inventory`);
      setInventory(data.inventory || []);
      setMember(data.member || null);
      setDeleteId(null);
    } catch {
      setError('Failed to delete item');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Only allow add/edit if member exists
  const canEdit = !!member;

  return (
    <>
      <div className="max-w-3xl mx-auto p-4">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <span>Food Inventory</span>
          <span className="ml-2 text-base font-normal text-gray-400">(Household)</span>
        </h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {loading ? <div>Loading...</div> : (
          <div className="space-y-6 mb-8">
            {inventory.length === 0 && (
              <div className="text-gray-500">No food items in inventory.</div>
            )}
            {Array.isArray(inventory) && inventory.map(item => {
              // ...existing code for rendering each item...
              const iconSrc = FOOD_TYPE_ICONS[item.foodType?.toLowerCase()] || otherFoodIcon;
              const linkedPetIds = foodPetLinks[item.id] || [];
              // Stock meters: one per full unopened bag, each 100%. If open bag, show meter for its fullness.
              const fullBags = Math.floor(Number(item.totalStock) || 0);
              const openBagFullnessMap = {
                'full': 100,
                'three-quarters': 75,
                'half': 50,
                'quarter': 25,
                'almost-empty': 10
              };
              const openBagPercent = item.openBag ? (openBagFullnessMap[item.openBagFullness] || 0) : 0;
              return (
                <div key={item.id} className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg shadow-sm bg-white relative">
                  {/* ...existing JSX for each item... */}
                  <div className="flex items-center gap-3 w-56 min-w-48">
                    <img src={iconSrc} alt={item.foodType || 'food'} className="w-7 h-7 inline-block align-middle mr-2" />
                    <div>
                      <div className="font-semibold text-lg">{item.brand || 'Brand'} <span className="text-gray-400 text-base font-normal">{item.foodType}</span></div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2 items-start">
                    {/* Show all fields in read-only mode */}
                    {(!canEdit || editingId !== item.id) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm w-full mb-2">
                        <div><span className="font-medium">Other:</span> {item.other}</div>
                        <div><span className="font-medium">Extra stock (full, unopened bags):</span> {item.totalStock}</div>
                        <div><span className="font-medium">Weight per bag (kg):</span> {item.weightKg}</div>
                        <div><span className="font-medium">Unit per serving:</span> {item.unitPerServing} {item.unitPerServingType}</div>
                        <div><span className="font-medium">Open bag:</span> {item.openBag ? 'Yes' : 'No'}</div>
                        {item.openBag && (
                          <div><span className="font-medium">Open bag fullness:</span> {item.openBagFullness}</div>
                        )}
                      </div>
                    )}
                    {/* Edit form (if editing) */}
                    {canEdit && editingId === item.id ? (
                      <form
                        className="flex flex-col gap-2 w-full"
                        onSubmit={e => { e.preventDefault(); handleEditFields(item.id); }}
                      >
                        {/* ...existing edit form fields... */}
                        <label className="font-medium">Type</label>
                        <select
                          className="input input-bordered"
                          value={editFields.foodType}
                          onChange={e => setEditFields(f => ({ ...f, foodType: e.target.value, brand: '' }))}
                          required
                        >
                          {FOOD_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <label className="font-medium">Brand</label>
                        <select
                          className="input input-bordered"
                          value={editFields.brand}
                          onChange={e => setEditFields(f => ({ ...f, brand: e.target.value, other: '' }))}
                          required
                          disabled={!editFields.foodType}
                        >
                          {(BRAND_OPTIONS[editFields.foodType] || ['']).map((b, idx) => (
                            <option key={b || idx} value={b}>{b || 'Select brand'}</option>
                          ))}
                        </select>
                        {editFields.brand === 'Custom/Other' && (
                          <input className="input input-bordered" placeholder="Other (custom brand or notes)" value={editFields.other} onChange={e => setEditFields(f => ({ ...f, other: e.target.value }))} />
                        )}
                        <label className="font-medium">Extra stock (full, unopened bags)</label>
                        <input className="input input-bordered" type="number" min="0" value={editFields.totalStock} onChange={e => setEditFields(f => ({ ...f, totalStock: e.target.value }))} required />
                        <label className="font-medium">Weight per bag (kg)</label>
                        <input className="input input-bordered" type="number" min="0.1" step="0.1" value={editFields.weightKg} onChange={e => setEditFields(f => ({ ...f, weightKg: e.target.value }))} required />
                        <label className="font-medium mt-2">Unit per serving</label>
                        <div className="flex gap-2 items-center">
                          <input
                            className="input input-bordered w-24"
                            type="number"
                            min="1"
                            step="1"
                            value={editFields.unitPerServing}
                            onChange={e => setEditFields(f => ({ ...f, unitPerServing: e.target.value }))}
                            required
                          />
                          <select
                            className="input input-bordered w-24"
                            value={editFields.unitPerServingType}
                            onChange={e => setEditFields(f => ({ ...f, unitPerServingType: e.target.value }))}
                          >
                            <option value="g">g (grams)</option>
                            <option value="cup">cup</option>
                            <option value="ml">ml</option>
                            <option value="other">other</option>
                          </select>
                        </div>
                        <hr className="my-2" />
                        <label className="font-medium mt-2">Current stock</label>
                        <div className="mb-2 text-sm text-gray-500">Do you have an open bag?</div>
                        <div className="flex gap-4 items-center">
                          <label className="flex items-center gap-1">
                            <input type="radio" name={`openBagEdit${item.id}`} checked={!!editFields.openBag} onChange={() => setEditFields(f => ({ ...f, openBag: true }))} /> Yes
                          </label>
                          <label className="flex items-center gap-1">
                            <input type="radio" name={`openBagEdit${item.id}`} checked={!editFields.openBag} onChange={() => setEditFields(f => ({ ...f, openBag: false, openBagFullness: '' }))} /> No
                          </label>
                        </div>
                        {editFields.openBag && (
                          <div className="flex flex-col gap-1">
                            <label className="font-medium">How full is the open bag?</label>
                            <select
                              className="input input-bordered"
                              value={editFields.openBagFullness}
                              onChange={e => setEditFields(f => ({ ...f, openBagFullness: e.target.value }))}
                              required
                            >
                              <option value="">Select fullness</option>
                              <option value="full">Full</option>
                              <option value="three-quarters">Three-quarters</option>
                              <option value="half">Half</option>
                              <option value="quarter">Quarter</option>
                              <option value="almost-empty">Almost empty</option>
                            </select>
                          </div>
                        )}
                        <div className="flex justify-end gap-2 mt-2">
                          <button className="btn btn-success" type="submit">Save</button>
                          <button className="btn btn-secondary" type="button" onClick={() => { setEditingId(null); setEditFields(null); }}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex w-full justify-end" style={{ position: 'relative', minHeight: '2rem' }}>
                        <div style={{ position: 'absolute', right: '1rem', bottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                          <button className="btn btn-sm btn-primary" onClick={() => { setEditingId(item.id); setEditFields({ ...item }); }}>Edit</button>
                          <button className="btn btn-sm btn-error" onClick={() => setDeleteId(item.id)}>Delete</button>
                              {deleteId && (
                                <ConfirmDialog
                                  title="Delete Food Item"
                                  message="Are you sure you want to delete this food item? This cannot be undone."
                                  confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
                                  cancelLabel="Cancel"
                                  onCancel={() => setDeleteId(null)}
                                  onConfirm={() => handleDeleteItem(deleteId)}
                                />
                              )}
                        </div>
                      </div>
                    )}
                    {/* Stock level meters: one per full unopened bag, each 100% */}
                    <div className="flex flex-col gap-1">
                      {Array.from({ length: fullBags }).map((_, idx) => (
                        <div key={idx} className="w-48 h-4 bg-gray-200 rounded overflow-hidden border border-gray-300 flex items-center mb-1">
                          <div className="bg-green-500 h-full transition-all" style={{ width: '100%' }} />
                        </div>
                      ))}
                      {/* Open bag meter, if exists */}
                      {item.openBag && openBagPercent > 0 && (
                        <div className="w-48 h-4 bg-gray-200 rounded overflow-hidden border border-gray-300 flex items-center mb-1">
                          <div className="bg-yellow-400 h-full transition-all" style={{ width: openBagPercent + '%' }} />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {fullBags > 0 && `${fullBags} unopened bag${fullBags > 1 ? 's' : ''} (100%)`}
                      {item.openBag && openBagPercent > 0 && (
                        <>
                          {fullBags > 0 && ' + '}
                          {`open bag (${openBagPercent}%)`}
                        </>
                      )}
                      {fullBags === 0 && (!item.openBag || openBagPercent === 0) && 'No stock'}
                    </div>
                    {/* Pet linking UI (demo only) */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-medium text-gray-700">Linked pets:</span>
                      {DEMO_PETS.map(pet => (
                        <label key={pet.id} className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={linkedPetIds.includes(pet.id)}
                            onChange={e => {
                              setFoodPetLinks(links => {
                                const prev = links[item.id] || [];
                                return {
                                  ...links,
                                  [item.id]: e.target.checked
                                    ? [...prev, pet.id]
                                    : prev.filter(id => id !== pet.id)
                                };
                              });
                            }}
                            disabled={!canEdit}
                          />
                          <span>{pet.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      {/* Add food item form (only if canEdit) */}
        {canEdit && (
          <>
            <h2 className="text-3xl font-bold mb-4">Add New Food to the Pantry</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-2 border p-4 rounded bg-gray-50">
          {/* Type dropdown */}
          <label className="font-medium">Type</label>
          <select
            className="input input-bordered"
            value={newItem.foodType}
            onChange={e => setNewItem(i => ({ ...i, foodType: e.target.value, brand: '' }))}
            required
          >
            {FOOD_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Brand dropdown, depends on type */}
          <label className="font-medium">Brand</label>
          <select
            className="input input-bordered"
            value={newItem.brand}
            onChange={e => setNewItem(i => ({ ...i, brand: e.target.value, other: '' }))}
            required
            disabled={!newItem.foodType}
          >
            {(BRAND_OPTIONS[newItem.foodType] || ['']).map((b, idx) => (
              <option key={b || idx} value={b}>{b || 'Select brand'}</option>
            ))}
          </select>
          {newItem.brand === 'Custom/Other' && (
            <input className="input input-bordered" placeholder="Other (custom brand or notes)" value={newItem.other} onChange={e => setNewItem(i => ({ ...i, other: e.target.value }))} />
          )}
          {/* Stock input */}
          <label className="font-medium">Extra stock (full, unopened bags)</label>
          <input className="input input-bordered" type="number" min="0" placeholder="e.g. 2" value={newItem.totalStock} onChange={e => setNewItem(i => ({ ...i, totalStock: e.target.value }))} required />
          <label className="font-medium">Weight per bag (kg)</label>
          <input className="input input-bordered" type="number" min="0.1" step="0.1" placeholder="e.g. 8" value={newItem.weightKg} onChange={e => setNewItem(i => ({ ...i, weightKg: e.target.value }))} required />
          <label className="font-medium mt-2">Unit per serving</label>
          <div className="flex gap-2 items-center">
            <input
              className="input input-bordered w-24"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 120"
              value={newItem.unitPerServing}
              onChange={e => setNewItem(i => ({ ...i, unitPerServing: e.target.value }))}
              required
            />
            <select
              className="input input-bordered w-24"
              value={newItem.unitPerServingType}
              onChange={e => setNewItem(i => ({ ...i, unitPerServingType: e.target.value }))}
            >
              <option value="g">g (grams)</option>
              <option value="cup">cup</option>
              <option value="ml">ml</option>
              <option value="other">other</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 mb-2">This is the default serving size for this food item. Per-pet serving can be set when logging feeding/activity.</div>
          <hr className="my-2" />
          <label className="font-medium mt-2">Current stock</label>
          <div className="mb-2 text-sm text-gray-500">Do you have an open bag?</div>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-1">
              <input type="radio" name="openBag" checked={!!newItem.openBag} onChange={() => setNewItem(i => ({ ...i, openBag: true }))} /> Yes
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="openBag" checked={!newItem.openBag} onChange={() => setNewItem(i => ({ ...i, openBag: false, openBagFullness: '' }))} /> No
            </label>
          </div>
          {newItem.openBag && (
            <div className="flex flex-col gap-1">
              <label className="font-medium">How full is the open bag?</label>
              <select
                className="input input-bordered"
                value={newItem.openBagFullness}
                onChange={e => setNewItem(i => ({ ...i, openBagFullness: e.target.value }))}
                required
              >
                <option value="">Select fullness</option>
                <option value="full">Full</option>
                <option value="three-quarters">Three-quarters</option>
                <option value="half">Half</option>
                <option value="quarter">Quarter</option>
                <option value="almost-empty">Almost empty</option>
              </select>
            </div>
          )}
          <div className="text-xs text-gray-500">All weights must be entered in kilograms (kg).</div>
          <button className="btn btn-primary mt-2" type="submit">Add</button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
