import React from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Contact</h1>
      <p className="text-sm text-gray-700 mb-4">For support or questions, email <a href="mailto:hello@example.com" className="text-accent hover:underline">hello@example.com</a>.</p>
      <p className="text-sm text-gray-600">Return to <Link to="/" className="text-accent hover:underline">Home</Link>.</p>
    </main>
  );
}
