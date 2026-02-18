import React, { useEffect, useState } from 'react';
import { apiUrl } from './api';

export default function FoodInventoryManager({ householdId }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState({ foodType: '', brand: '', description: '', totalStock: '', unit: '' });
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState('');

  useEffect(() => {
    if (!householdId) return;
    setLoading(true);
    fetch(apiUrl(`/api/households/${householdId}/food-inventory`), { credentials: 'include' })
      .then(r => r.json())
      .then(setInventory)
      .catch(() => setError('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, [householdId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/households/${householdId}/food-inventory`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...newItem, totalStock: parseFloat(newItem.totalStock) })
      });
      if (!res.ok) throw new Error('Add failed');
      setNewItem({ foodType: '', brand: '', description: '', totalStock: '', unit: '' });
      setInventory(await (await fetch(apiUrl(`/api/households/${householdId}/food-inventory`), { credentials: 'include' })).json());
    } catch {
      setError('Failed to add item');
    }
  };

  const handleEditStock = async (id) => {
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/food-inventory/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ totalStock: parseFloat(editStock) })
      });
      if (!res.ok) throw new Error('Update failed');
      setEditingId(null);
      setEditStock('');
      setInventory(await (await fetch(apiUrl(`/api/households/${householdId}/food-inventory`), { credentials: 'include' })).json());
    } catch {
      setError('Failed to update stock');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Food Inventory</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? <div>Loading...</div> : (
        <table className="min-w-full border mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Brand</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Stock</th>
              <th className="p-2 border">Unit</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                <td className="p-2 border">{item.foodType}</td>
                <td className="p-2 border">{item.brand}</td>
                <td className="p-2 border">{item.description}</td>
                <td className="p-2 border">
                  {editingId === item.id ? (
                    <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} className="input input-bordered w-20" />
                  ) : (
                    item.totalStock
                  )}
                </td>
                <td className="p-2 border">{item.unit}</td>
                <td className="p-2 border">
                  {editingId === item.id ? (
                    <button className="btn btn-sm btn-success mr-2" onClick={() => handleEditStock(item.id)}>Save</button>
                  ) : (
                    <button className="btn btn-sm btn-primary mr-2" onClick={() => { setEditingId(item.id); setEditStock(item.totalStock); }}>Edit</button>
                  )}
                  {editingId === item.id && (
                    <button className="btn btn-sm btn-secondary" onClick={() => { setEditingId(null); setEditStock(''); }}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 border p-4 rounded bg-gray-50">
        <h3 className="font-semibold mb-2">Add Food Item</h3>
        <input className="input input-bordered" placeholder="Type (e.g. pellets)" value={newItem.foodType} onChange={e => setNewItem(i => ({ ...i, foodType: e.target.value }))} required />
        <input className="input input-bordered" placeholder="Brand" value={newItem.brand} onChange={e => setNewItem(i => ({ ...i, brand: e.target.value }))} />
        <input className="input input-bordered" placeholder="Description" value={newItem.description} onChange={e => setNewItem(i => ({ ...i, description: e.target.value }))} />
        <input className="input input-bordered" type="number" placeholder="Stock (e.g. 2000)" value={newItem.totalStock} onChange={e => setNewItem(i => ({ ...i, totalStock: e.target.value }))} required />
        <input className="input input-bordered" placeholder="Unit (e.g. g, kg, bags)" value={newItem.unit} onChange={e => setNewItem(i => ({ ...i, unit: e.target.value }))} />
        <button className="btn btn-primary mt-2" type="submit">Add</button>
      </form>
    </div>
  );
}
