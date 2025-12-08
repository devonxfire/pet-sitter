import React from 'react'

export default function TimelineBlock(){
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Example timeline</h3>
            <p className="text-gray-600 mb-8">See how a household uses the timeline to coordinate daily care — meals, walks, meds and sitter notes.</p>

            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Morning feeding</div>
                  <div className="text-xs text-gray-400">7:00 AM</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Walk (30 min)</div>
                  <div className="text-xs text-gray-400">9:30 AM</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Medication</div>
                  <div className="text-xs text-gray-400">2:00 PM</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Afternoon check-in</div>
                  <div className="text-xs text-gray-400">5:30 PM</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 h-80 bg-gray-100">
              <picture>
                <source srcSet="/timeline-photo.svg" type="image/svg+xml" />
                <img src="/timeline-example.svg" alt="Timeline example" className="object-cover w-full h-full" onError={(e)=>{e.currentTarget.style.display='none'}} />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
