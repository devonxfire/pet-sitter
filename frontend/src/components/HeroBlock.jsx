import React from 'react'
import { Link } from 'react-router-dom'

export default function HeroBlock({ user, onSignOut }) {
  return (
    <section className="relative overflow-hidden">
      {/* Background image layer (decorative) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center hero-img--bw"
        style={{ backgroundImage: `url('/hero-pets.jpg')` }}
      />
      {/* Darker overlay for stronger contrast */}
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-black/30" />

      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-28 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
            <h1 className="hero-heading text-5xl md:text-6xl font-extrabold leading-tight text-center md:text-left">
              <span className="block">Welcome to <span style={{ color: 'var(--brand-red)' }}>Pet</span>Daily.</span>
              <span className="block text-3xl md:text-4xl font-light text-white mt-3">Making pet care simple, reliable and beautiful.</span>
            </h1>
            <p className="mt-4 md:mt-6 text-white/90 text-lg max-w-xl">Coordinate feeding, walks, meds, and visits with your household. A clear timeline, handy reminders, and shared plans that keep everyone in sync.</p>
          </div>

          {/* right-side decorative image removed - background is full-bleed now */}
        </div>

        {/* CTA buttons placed under the heading and left-aligned with heading text */}
        <div className="md:col-span-7 mt-8">
            <div className="flex justify-start">
              <div className="w-full max-w-xl">
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  {user ? (
                    <>
                      <Link to="/dashboard" className="btn btn-red text-lg font-normal px-8 py-5 flex-1">My Pets</Link>
                      <Link
                        to="#"
                        className="btn btn-secondary text-lg font-normal px-8 py-5 flex-1"
                        onClick={e => { e.preventDefault(); onSignOut && onSignOut(); }}
                      >
                        Sign out
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/create-household" className="btn btn-red text-lg font-normal px-8 py-5 flex-1">Get started — it's free</Link>
                      <Link to="/login" className="btn btn-secondary text-lg font-normal px-8 py-5 flex-1">Sign in</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>
  )
}