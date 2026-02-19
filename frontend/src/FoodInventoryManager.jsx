import React, { useEffect, useState } from 'react';
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

export default function FoodInventoryManager({ householdId }) {
  const [inventory, setInventory] = useState([]);
  const [member, setMember] = useState(null); // null = not a member, object = member
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState({ foodType: '', brand: '', description: '', totalStock: '', unit: '' });
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState('');
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
      setNewItem({ foodType: '', brand: '', description: '', totalStock: '', unit: '' });
      // Refetch inventory and member
      const data = await apiFetch(`/api/households/${householdId}/food-inventory`);
      setInventory(data.inventory || []);
      setMember(data.member || null);
    } catch {
      setError('Failed to add item');
    }
  };

  const handleEditStock = async (id) => {
    setError('');
    try {
      await apiFetch(`/api/food-inventory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ totalStock: parseFloat(editStock) })
      });
      setEditingId(null);
      setEditStock('');
      // Refetch inventory and member
      const data = await apiFetch(`/api/households/${householdId}/food-inventory`);
      setInventory(data.inventory || []);
      setMember(data.member || null);
    } catch {
      setError('Failed to update stock');
    }
  };

  // Only allow add/edit if member exists
  const canEdit = !!member;

  return (
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
            // Stock level bar logic
            const percent = Math.max(0, Math.min(100, Math.round((parseFloat(item.totalStock) || 0) / 20 * 100)));
            let fillColor = 'bg-green-500';
            if (percent <= 25) fillColor = 'bg-red-500';
            else if (percent <= 50) fillColor = 'bg-yellow-400';
            // Icon
            const iconSrc = FOOD_TYPE_ICONS[item.foodType?.toLowerCase()] || otherFoodIcon;
            // Linked pets
            const linkedPetIds = foodPetLinks[item.id] || [];
            return (
              <div key={item.id} className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg shadow-sm bg-white">
                <div className="flex items-center gap-3 w-56 min-w-[12rem]">
                  <img src={iconSrc} alt={item.foodType || 'food'} className="w-7 h-7 inline-block align-middle mr-2" />
                  <div>
                    <div className="font-semibold text-lg">{item.brand || 'Brand'} <span className="text-gray-400 text-base font-normal">{item.foodType}</span></div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2 items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Stock:</span>
                    {canEdit && editingId === item.id ? (
                      <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} className="input input-bordered w-20" />
                    ) : (
                      <span>{item.totalStock} {item.unit}</span>
                    )}
                    {canEdit && (editingId === item.id ? (
                      <>
                        <button className="btn btn-sm btn-success ml-2" onClick={() => handleEditStock(item.id)}>Save</button>
                        <button className="btn btn-sm btn-secondary ml-2" onClick={() => { setEditingId(null); setEditStock(''); }}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-primary ml-2" onClick={() => { setEditingId(item.id); setEditStock(item.totalStock); }}>Edit</button>
                    ))}
                  </div>
                  {/* Stock level bar */}
                  <div className="w-48 h-4 bg-gray-200 rounded overflow-hidden border border-gray-300 flex items-center">
                    <div className={`${fillColor} h-full transition-all`} style={{ width: percent + '%' }} />
                  </div>
                  <div className="text-xs text-gray-500">Stock level: {percent}%</div>
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
        <form onSubmit={handleAdd} className="flex flex-col gap-2 border p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Add Food Item</h3>
          <input className="input input-bordered" placeholder="Type (e.g. pellets)" value={newItem.foodType} onChange={e => setNewItem(i => ({ ...i, foodType: e.target.value }))} required />
          <input className="input input-bordered" placeholder="Brand" value={newItem.brand} onChange={e => setNewItem(i => ({ ...i, brand: e.target.value }))} />
          <input className="input input-bordered" placeholder="Description" value={newItem.description} onChange={e => setNewItem(i => ({ ...i, description: e.target.value }))} />
          <input className="input input-bordered" type="number" placeholder="Stock (e.g. 2000)" value={newItem.totalStock} onChange={e => setNewItem(i => ({ ...i, totalStock: e.target.value }))} required />
          <input className="input input-bordered" placeholder="Unit (e.g. g, kg, bags)" value={newItem.unit} onChange={e => setNewItem(i => ({ ...i, unit: e.target.value }))} />
          <button className="btn btn-primary mt-2" type="submit">Add</button>
        </form>
      )}
    </div>
  );
}
