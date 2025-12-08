import React from 'react'
import { Link } from 'react-router-dom'

export default function HeroBlock() {
  return (
    <section className="relative bg-white">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">Make pet care simple, reliable, and beautiful</h2>
            <p className="mt-8 text-gray-600 text-lg max-w-xl">Coordinate feeding, walks, meds, and visits with your household. A clear timeline, handy reminders, and shared plans that keep everyone in sync.</p>

            <div className="mt-12 flex flex-wrap gap-4">
              <Link to="/create-household" className="inline-flex items-center bg-accent text-white px-6 py-4 rounded-lg font-semibold shadow-lg text-lg">Get started — it's free</Link>
              <Link to="/login" className="inline-flex items-center border border-gray-200 px-6 py-4 rounded-lg text-gray-700 text-lg">Sign in</Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="overflow-hidden">
              <div className="w-full h-96 sm:h-[420px] md:h-[520px] bg-transparent flex items-center justify-center">
                <picture>
                  {/* Prefer a transparent PNG if generated (see scripts/remove-hero-bg.sh) */}
                
                  <source srcSet="/hero-pets.png" type="image/png" />
                  <source srcSet="/hero-pets-photo.svg" type="image/svg+xml" />
                  <img src="/hero-pets.svg" alt="Happy pets" className="object-cover w-full h-full" onError={(e)=>{e.currentTarget.style.display='none'}} />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
