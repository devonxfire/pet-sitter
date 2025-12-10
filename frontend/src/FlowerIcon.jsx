import React from 'react';
import { FLOWER_LIST } from './flowerIcon';

// Simple FlowerIcon component
// Props:
// - variant: integer index into FLOWER_LIST (0..n-1). If omitted, will hash `seed`.
// - seed: fallback string used to choose a variant deterministically
// - size: number in px (default 18)
// - className: tailwind/class string
// - accent: CSS color for accent (default uses CSS var if present)
export default function FlowerIcon({ variant, seed, size = 18, className = '', accent = 'var(--color-accent)' }) {
  // Determine variant index
  let idx = 0;
  if (typeof variant === 'number' && variant >= 0) idx = variant % FLOWER_LIST.length;
  else if (seed) {
    // simple string hash
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    idx = Math.abs(h) % FLOWER_LIST.length;
  }

  // Render emoji flower for this variant
  const flower = FLOWER_LIST[idx] || '🌸';
  return (
    <span
      className={className}
      style={{ fontSize: size, lineHeight: 1, verticalAlign: 'middle', userSelect: 'none' }}
      aria-label="flower"
      role="img"
    >
      {flower}
    </span>
  );
}
