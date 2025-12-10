const FLOWERS = ['🌸','🌺','🌼','🌻','🌷','🌹','💐'];

// Simple string hash (deterministic)
function strHash(s) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h >>> 0);
}

// Assign flowers to a household's pets deterministically while trying to
// avoid duplicates when the number of pets <= number of available flowers.
// pets: array of objects with at least `id` (preferred) or `name`.
export function assignHouseholdFlowers(pets = []) {
  const map = {};
  if (!Array.isArray(pets) || pets.length === 0) return map;

  // Normalize a stable ordering so assignment is deterministic.
  const normalized = pets.map(p => ({ id: String(p.id || p.name || ''), name: p.name || '' }));
  normalized.sort((a, b) => a.id.localeCompare(b.id));

  const nFlowers = FLOWERS.length;
  if (normalized.length <= nFlowers) {
    // assign unique flowers: use the hash of the id to pick a starting index,
    // then fill available flowers in rotation to reduce clustering.
    // To keep deterministic mapping across households, compute an offset.
    const householdSalt = normalized.reduce((acc, p) => acc + strHash(p.id), 0);
    let start = householdSalt % nFlowers;
    for (let i = 0; i < normalized.length; i++) {
      const idx = (start + i) % nFlowers;
      map[normalized[i].id] = FLOWERS[idx];
    }
    return map;
  }

  // More pets than flowers: distribute by hashing pet id to a flower index.
  for (const p of normalized) {
    const idx = strHash(p.id) % nFlowers;
    map[p.id] = FLOWERS[idx];
  }
  return map;
}

// Fallback simple flower for single pet when household list is not available.
export function getFallbackFlower(key) {
  if (!key) return FLOWERS[0];
  return FLOWERS[strHash(String(key)) % FLOWERS.length];
}

export const FLOWER_LIST = FLOWERS;

// Provide a default export for environments or imports that expect one.
export default {
  assignHouseholdFlowers,
  getFallbackFlower,
  FLOWER_LIST
};
