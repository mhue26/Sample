/**
 * UI color palette — single source of truth for app styling.
 * Use these constants in style props and when building class names.
 * Corresponding CSS variables are in globals.css for Tailwind (e.g. bg-ui-primary).
 */

export const colors = {
  /** Primary dark: headings, primary buttons, focus rings */
  primary: "#3D4756",
  /** Primary hover state for buttons and links */
  primaryHover: "#2A3441",
  /** Accent text and form focus (warm gray) */
  accent: "#584b53",
  /** Accent highlight: link hover, input borders, active states */
  accentHighlight: "#E4BB97",
  /** Light warm background: badges, dropdown active, profile fallback */
  accentBg: "#FEF5eF",
  /** Muted secondary text (e.g. empty states) */
  muted: "#A1ACBD",
  /** Blue accent: landing hero, highlights, decorative elements */
  blueAccent: "#D6E3F8",
  /** Lighter blue for subtle backgrounds */
  blueAccentLight: "#E8EFF9",
  /** Form focus (underline / border) — blue-lavender, pairs with blueAccent */
  formFocusLavender: "#9CA3D4",
} as const;

export type ColorKey = keyof typeof colors;
