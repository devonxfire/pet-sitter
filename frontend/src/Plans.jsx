import React from "react";

const plans = [
  {
    color: "blue",
    emoji: "🟦",
    name: "FREE — Basic",
    price: "$0 / forever",
    pets: "Up to 2 pets",
    features: [
      "Log activities (Feeding, Water, Walks, Play, Grooming, Medication, etc.)",
      "Unlimited activity history",
      "Upload photos",
      "Basic timeline view",
      "Single household",
      "Up to 3 members per household",
      "Push notifications for confirmations",
      "Activity icons + color coding"
    ],
    limitations: [
      "Reminders disabled",
      "No multi-household support",
      "No sitter sharing",
      "Limited storage (e.g., 100 photos)",
      "Ads shown"
    ]
  },
  {
    color: "green",
    emoji: "🟩",
    name: "PREMIUM — Pro",
    price: "$5.99 / month\nor $49 / year",
    pets: "Up to 10 pets",
    subtitle: "Best for multi-pet homes",
    features: [
      "Everything in FREE, plus:",
      "Smart reminders (Feeding schedules, walks, medication, grooming alerts)",
      "Unlimited sitter/family sharing",
      "Multi-household support (Home, holiday house, partner’s house, etc.)",
      "Advanced weekly/monthly reports",
      "Food stock tracker + low-stock alerts",
      "Vet visit manager",
      "No ads",
      "Unlimited storage (or very high limit)",
      "Priority support"
    ]
  },
  {
    color: "orange",
    emoji: "🟧",
    name: "CARE TEAMS — Business",
    price: "From $19.99/month per sitter\nor $99/month per team",
    pets: "Unlimited pets",
    subtitle: "Designed for sitters, shelters, rescues & walkers",
    features: [
      "Includes everything in Premium, plus:",
      "Scheduling calendar for visits, walks, meds",
      "GPS check-ins for sitters",
      "Client pet profiles",
      "Task assignments across team members",
      "Exportable reports",
      "Custom branding (logo, colors, optional domain)",
      "Team roles & permissions",
      "Bulk data import/export",
      "Priority business support",
      "API access (optional)"
    ]
  }
];

function PlanCard({ plan }) {
  const colorMap = {
    blue: "border-blue-500 bg-blue-50",
    green: "border-green-500 bg-green-50",
    orange: "border-orange-400 bg-orange-50"
  };
  return (
    <div className={`rounded-2xl shadow-md border-2 p-6 mb-8 ${colorMap[plan.color]}`}
      style={{ minWidth: 320, maxWidth: 400 }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl">{plan.emoji}</span>
        <span className="font-bold text-xl text-gray-900">{plan.name}</span>
      </div>
      <div className="text-lg font-semibold mb-1">{plan.price}</div>
      <div className="text-base mb-2">🐾 <span className="font-medium">{plan.pets}</span></div>
      {plan.subtitle && <div className="text-sm text-gray-600 mb-2">⭐ {plan.subtitle}</div>}
      <div className="mb-2">
        <div className="font-semibold text-gray-800 mb-1">Features:</div>
        <ul className="list-none ml-0 mb-2">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 mb-1">
              <span className="text-green-600 font-bold">✔</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      {plan.limitations && (
        <div className="mb-2">
          <div className="font-semibold text-gray-800 mb-1">Limitations:</div>
          <ul className="list-none ml-0">
            {plan.limitations.map((l, i) => (
              <li key={i} className="flex items-start gap-2 mb-1">
                <span className="text-red-500 font-bold">✖</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 ml-1">Plans</h1>
        <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center">
          {plans.map((plan, idx) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}
