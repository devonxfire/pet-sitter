import React from 'react';
import FoodInventoryManager from './FoodInventoryManager';
import { useParams } from 'react-router-dom';

export default function HouseholdFoodInventoryPage() {
  const { householdId } = useParams();
  // If householdId is not in params, could also get from localStorage or context
  // For now, fallback to localStorage for demo
  const fallbackHouseholdId = householdId || (JSON.parse(localStorage.getItem('household') || '{}').id);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Household Food Inventory</h1>
      <FoodInventoryManager householdId={fallbackHouseholdId} />
    </div>
  );
}
