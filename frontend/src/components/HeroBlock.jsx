import React from 'react'
import { Link } from 'react-router-dom'

export default function HeroBlock() {
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

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <h2 className="text-5xl md:text-6xl font-extrabold leading-tight text-white">Make pet care simple, reliable, and beautiful</h2>
            <p className="mt-8 text-white/90 text-lg max-w-xl">Coordinate feeding, walks, meds, and visits with your household. A clear timeline, handy reminders, and shared plans that keep everyone in sync.</p>
          </div>

          {/* right-side decorative image removed - background is full-bleed now */}
        </div>

        {/* Centered CTA buttons across the hero width */}
        <div className="mt-8 cta-equal">
          <Link to="/create-household" className="inline-flex items-center bg-accent text-white px-6 py-4 font-semibold shadow-lg text-lg btn">Get started — it's free</Link>
          <Link to="/login" className="inline-flex items-center px-6 py-4 text-white text-lg btn-secondary">Sign in</Link>
        </div>
      </div>
    </section>
  )
}