function ActivityLogExampleImage() {
  return (
    <div className="w-full h-auto flex items-center justify-center">
      <img
        src={"/activitylog-example.png"}
        alt="Example Activity Log"
        className="rounded-xl border border-gray-200 shadow-sm max-w-full h-auto transform transition-transform duration-200 ease-out hover:scale-105"
        style={{ background: '#f7f8fa' }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
import React from 'react'
import { Link } from 'react-router-dom'
import HeroBlock from './components/HeroBlock'
import FeaturesBlock from './components/FeaturesBlock'
import TimelineExampleImage from './components/TimelineExampleImage'
import TimelineBlock from './components/TimelineBlock'

export default function Landing({ user, onSignOut }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main>
        <HeroBlock user={user} onSignOut={onSignOut} />
        <FeaturesBlock />
        <section className="py-8 bg-white">
            <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">Activity Timeline Example</h3>
                <p className="text-gray-600 mb-6 max-w-xl">See how a household uses the timeline to coordinate daily care — meals, walks, meds and sitter notes. Receive instant notifications of activities from your household about each pet.</p>
              </div>
              <div className="flex items-center justify-center md:justify-end">
                <div className="w-full max-w-2xl">
                  <TimelineExampleImage />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 bg-white">
            <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="flex items-center justify-center md:justify-start order-1 md:order-none">
                <div className="w-full max-w-2xl">
                  <ActivityLogExampleImage />
                </div>
              </div>
              <div className="order-2 md:order-none text-right">
                <h3 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">Documented Activity Logs</h3>
                <p className="text-gray-600 mb-6 max-w-xl ml-auto">View and edit all activities, past, present and upcoming. Add notes or upload photos to document any activity!</p>
              </div>
            </div>
          </div>
        </section>
       
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-2xl font-semibold text-center mb-6">Loved by households and sitters</h3>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="p-6 bg-gray-50 rounded-xl text-center">"Makes pet care easy." — Alex</div>
              <div className="p-6 bg-gray-50 rounded-xl text-center">"Love the reminders." — Priya</div>
              <div className="p-6 bg-gray-50 rounded-xl text-center">"My sitters use it daily." — Jordan</div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-500">© {new Date().getFullYear()} PetDaily</div>
          <div className="mt-4 sm:mt-0 flex items-center gap-4 text-sm">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-700">Privacy</Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-700">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
