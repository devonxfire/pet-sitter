// Small helper: generate a short, pet-specific quote using templates.
// This is deterministic and offline — no external API calls required.
export function getPetQuote(name) {
  const n = name || 'Your pet';
  const templates = [
    `${n} is the little miracle that makes every day brighter.`,
    `Home is where ${n} greets you with a wag and a smile.`,
    `${n} fills ordinary moments with extraordinary love.`,
    `Life is better with ${n} by your side.`,
    `${n} teaches the heart how to be gentle again.`
  ];
  // pick a pseudo-random template based on name so it feels consistent
  let sum = 0;
  for (let i = 0; i < n.length; i++) sum += n.charCodeAt(i);
  return templates[sum % templates.length];
}