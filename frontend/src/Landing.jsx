import React from 'react'
import { Link } from 'react-router-dom'
import HeroBlock from './components/HeroBlock'
import FeaturesBlock from './components/FeaturesBlock'
import TimelineBlock from './components/TimelineBlock'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center text-white font-bold">PS</div>
            <h1 className="text-xl font-semibold">Pet-Sitter</h1>
          </div>

          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">Home</Link>
            <Link to="/plans" className="text-sm text-gray-600 hover:text-gray-900">Plans</Link>
            <Link to="/login" className="text-sm text-accent hover:underline">Log in</Link>
            <Link to="/create-household" className="hidden sm:inline-block bg-accent text-white text-sm px-4 py-2 rounded-md">Get started</Link>
          </nav>
        </div>
      </header>

      <main>
        <HeroBlock />
        <FeaturesBlock />
        <TimelineBlock />

        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-2xl font-semibold text-center mb-6">Loved by households and sitters</h3>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 bg-gray-50 rounded-xl text-center">"Makes pet care easy." — Alex</div>
              <div className="p-6 bg-gray-50 rounded-xl text-center">"Love the reminders." — Priya</div>
              <div className="p-6 bg-gray-50 rounded-xl text-center">"My sitters use it daily." — Jordan</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-500">© {new Date().getFullYear()} Pet-Sitter</div>
          <div className="mt-4 sm:mt-0 flex items-center gap-4 text-sm">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-700">Privacy</Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-700">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

