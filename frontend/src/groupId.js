// Utility to generate a groupId (UUID v4)
export function generateGroupId() {
  // Use crypto API if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: random string
  return 'gid-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now();
}
