import React from 'react'
import { Link } from 'react-router-dom'
import HeroBlock from './components/HeroBlock'
import FeaturesBlock from './components/FeaturesBlock'
import TimelineBlock from './components/TimelineBlock'

export default function Landing({ user, onSignOut }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main>
        <HeroBlock user={user} onSignOut={onSignOut} />
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
