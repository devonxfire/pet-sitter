# Tailwind CSS Issue - Content Detection

## Problem
Tailwind v4 with `@tailwindcss/vite` plugin is not properly detecting and generating spacing classes (e.g., `mb-32`, `mb-48`) from JSX files.

### Current Workaround
For now, using inline styles for spacing/margin that need to be reliably applied:
```jsx
style={{ marginBottom: '128px' }}
```

## Investigation
- ✅ Created `tailwind.config.js` with proper content paths
- ✅ Added safelist for common spacing classes
- ❌ Still not applying mb-32 and similar classes

## TODO - When Focusing on UI
When the project moves into more serious UI work:
1. **Debug Tailwind setup** - May need to:
   - Update Vite config
   - Check if `@tailwindcss/vite` v4 has known issues with class detection
   - Consider switching to traditional Tailwind if v4 continues to cause issues
   
2. **Make Tailwind the single source of truth** for all styling
   - Remove inline styles once Tailwind is working reliably
   - Establish strict Tailwind-only rule for consistency

## Files to Check
- `/frontend/tailwind.config.js` - Config file
- `/frontend/vite.config.js` - Vite setup
- `/frontend/src/index.css` - Tailwind imports
- `/frontend/package.json` - Tailwind version (currently v4 with @tailwindcss/vite)
