import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <p className="text-sm text-gray-700 mb-4">This is a placeholder for the Terms of Service. Replace with your legal text.</p>
      <p className="text-sm text-gray-600">Return to <Link to="/" className="text-accent hover:underline">Home</Link>.</p>
    </main>
  );
}
