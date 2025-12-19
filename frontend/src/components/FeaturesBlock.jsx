import React from 'react'
import featurePet from '/features-pet.png'

function Icon({name}){
  const common = { className: 'w-6 h-6', strokeWidth: 2, fill: 'none', stroke: '#C3001F' };
  switch(name){
    case 'timeline':
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h6l2 2 4-4 4 4" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-1a4 4 0 00-3-3.87M7 20v-1a4 4 0 013-3.87M12 12a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    case 'camera':
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h3l2-3h6l2 3h3v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-4.5-6-10a6 6 0 1112 0c0 5.5-6 10-6 10z" />
          <circle cx="12" cy="11" r="2" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common} viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V8a5 5 0 0110 0v3" />
        </svg>
      )
    default:
      return null;
  }
}

function FeatureCard({icon, title, desc}){
  return (
    <div className="p-6 bg-white rounded-xl">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 flex items-center justify-center">
          <Icon name={icon} />
        </div>
        <div>
          <div className="font-medium text-base align-middle">{title}</div>
          <div className="text-sm text-gray-500">{desc}</div>
        </div>
      </div>
    </div>
  )
}

export default function FeaturesBlock(){
  return (
    <section className="pt-4 pb-0 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading moved into left column to avoid duplication on narrow screens */}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left: large image (spans larger portion on desktop) */}
          <div className="md:col-span-4">
            <div className="w-full h-72 md:h-[560px] rounded-2xl overflow-hidden flex items-center justify-center bg-transparent">
              <img src={featurePet} alt="App features" className="max-w-full max-h-full object-contain" loading="lazy" decoding="async" />
            </div>
          </div>

          {/* Right: features list */}
          <div className="md:col-span-8 flex flex-col justify-center">
            <h3 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">Features</h3>
            <p className="text-gray-600 mb-6">Everything a household and their sitters need to keep pet care predictable — timelines, reminders, records and sharing.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FeatureCard icon="timeline" title="Activity Timeline" desc="Log and view pet care actions in one place." />
              <FeatureCard icon="users" title="Household Sharing" desc="Invite family and sitters to share care plans." />
              <FeatureCard icon="bell" title="Reminders & Alerts" desc="Never miss medication or feeding times again." />
              <FeatureCard icon="camera" title="Photo & Records" desc="Store photos, vet info and dietary notes." />
              <FeatureCard icon="pin" title="Visit Logs" desc="Track sitters and visits with quick notes." />
              <FeatureCard icon="lock" title="Privacy Controls" desc="Keep household data private and share selectively." />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
