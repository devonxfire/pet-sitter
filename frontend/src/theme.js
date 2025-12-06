/**
 * Pet-Sitter Theme Configuration
 * 
 * Color Scheme:
 * - Primary Accent: Muted Turquoise (#20B2AA)
 *   Used for: buttons, focus states, hover effects, toggles, accent colors
 *   Reason: Calming, relaxing color that creates a pet-care friendly atmosphere
 * 
 * - Background: White (#FFFFFF) with Light Gray (#F3F4F6) for sections
 * - Text: Dark Gray (#1C1C1E) for main text
 * - Borders: Light Gray (#E5E7EB)
 * - Neutral Gray: #6B7280 for secondary text
 * - Error: Red (#EF4444) for emergency actions (e.g., vet call button)
 */

export const theme = {
  colors: {
    primary: '#20B2AA',        // Muted Turquoise - main accent color
    primaryLight: '#E0F2F1',   // Very light turquoise for backgrounds
    primaryDark: '#1A9B8E',    // Darker turquoise for hover states
    
    // Neutrals
    white: '#FFFFFF',
    lightGray: '#F3F4F6',
    gray: '#9CA3AF',
    darkGray: '#4B5563',
    textPrimary: '#1C1C1E',
    textSecondary: '#6B7280',
    
    // Functional
    border: '#E5E7EB',
    error: '#EF4444',
    errorHover: '#DC2626',
    
    // Semantic
    success: '#10B981',
    warning: '#F59E0B',
  },
  
  typography: {
    headingLarge: 'text-5xl font-bold',      // Page titles
    headingMedium: 'text-2xl font-bold',     // Section titles
    headingSmall: 'text-lg font-semibold',   // Subsection titles
    bodyLarge: 'text-lg',
    bodyNormal: 'text-base',
    bodySmall: 'text-sm',
  },
  
  spacing: {
    sectionGap: '30px',                      // Gap between sections
    sectionBottomMargin: 'mb-64',            // Large spacing (256px)
    sectionBottomMarginDefault: 'mb-48',     // Default spacing (192px)
  },
};
