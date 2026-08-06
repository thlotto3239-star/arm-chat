---
name: Arm Chat Design System
colors:
  surface: '#fff8f0'
  surface-dim: '#e0d9d0'
  surface-bright: '#fff8f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf3e9'
  surface-container: '#f4ede3'
  surface-container-high: '#eee7dd'
  surface-container-highest: '#e8e2d8'
  on-surface: '#1e1b16'
  on-surface-variant: '#3c4a3d'
  inverse-surface: '#33302a'
  inverse-on-surface: '#f7f0e6'
  outline: '#6c7b6b'
  outline-variant: '#bbcbb9'
  surface-tint: '#006d2f'
  primary: '#006d2f'
  on-primary: '#ffffff'
  primary-container: '#25d366'
  on-primary-container: '#005523'
  inverse-primary: '#3de273'
  secondary: '#4f6448'
  on-secondary: '#ffffff'
  secondary-container: '#d1eac6'
  on-secondary-container: '#556a4d'
  tertiary: '#005cbd'
  on-tertiary: '#ffffff'
  tertiary-container: '#93b8ff'
  on-tertiary-container: '#004694'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#66ff8e'
  primary-fixed-dim: '#3de273'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005322'
  secondary-fixed: '#d1eac6'
  secondary-fixed-dim: '#b5cdab'
  on-secondary-fixed: '#0d200a'
  on-secondary-fixed-variant: '#384c32'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#abc7ff'
  on-tertiary-fixed: '#001b3f'
  on-tertiary-fixed-variant: '#004590'
  background: '#fff8f0'
  on-background: '#1e1b16'
  surface-variant: '#e8e2d8'
  ink: '#1c1e21'
  ink-muted: '#5e5e5e'
  surface-white: '#ffffff'
  surface-dark: '#000000'
typography:
  display-xl:
    fontFamily: Prompt
    fontSize: 80px
    fontWeight: '400'
    lineHeight: 80px
    letterSpacing: -0.02em
  display-xl-mobile:
    fontFamily: Prompt
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 52px
    letterSpacing: -0.01em
  display-lg:
    fontFamily: Prompt
    fontSize: 60px
    fontWeight: '400'
    lineHeight: 60px
  display-md:
    fontFamily: Prompt
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 48px
  body-lg:
    fontFamily: Prompt
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 25px
  body-md:
    fontFamily: Prompt
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 22px
  button-md:
    fontFamily: Prompt
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 16px
  label-sm:
    fontFamily: Prompt
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 15.6px
  label-xs:
    fontFamily: Prompt
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 12px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  huge: 80px
---

## Brand & Style

The design system for this Thai messaging application centers on the concept of "The Calm Utility." It evokes a sense of reliability and human warmth, moving away from cold, technical interfaces toward a "canvas-first" experience. The brand personality is professional yet approachable, utilizing a sophisticated color palette that feels organic rather than digital.

The visual style is a blend of **Minimalism** and **High-Contrast Boldness**. It rejects traditional depth markers like shadows and blurs in favor of extreme geometric clarity and massive typographic scaling. The system is defined by a rigorous "weight-400 discipline," where hierarchy is established through size and color rather than font weight, creating a clean, editorial aesthetic that prioritizes Thai legibility.

## Colors

The color strategy uses a warm cream (#fcf5eb) as the primary canvas to reduce eye strain and provide a more "analog" feel compared to pure white. 

- **Primary (Voltage Green):** Reserved exclusively for high-intent actions, primary buttons, and active status indicators.
- **Secondary (Pale Leaf):** Used specifically for outgoing chat bubble backgrounds to provide a soft contrast against the cream canvas.
- **Ink (#1c1e21):** The universal text and border color. High-contrast ink is used even on primary green backgrounds to maintain maximum legibility.
- **Surface Tiers:** Pure white (#ffffff) is used for floating cards and chips to create a subtle "lift" from the cream background without using shadows.

## Typography

The typography system relies entirely on the **Prompt** typeface, selected for its exceptional rendering of Thai glyphs and modern, geometric structure. 

**The Weight-400 Rule:** No bold or medium weights are permitted. To create emphasis, scale the font size up or shift the color to the primary ink. This creates a rhythmic, open feel that is highly legible in Thai. 

For mobile screens, the Display XL tier scales down to 48px to ensure headlines do not break awkwardly while maintaining their impact. All body text should use a line-height of at least 1.4x the font size to accommodate the vertical height of Thai vowels and tone marks.

## Layout & Spacing

This design system follows a **fluid grid** model with generous margins. The layout is structured on a 4px base unit, though 12px (sm) and 16px (md) are the primary atoms for component internal spacing.

- **Desktop:** A 12-column grid with 80px (huge) vertical section gaps.
- **Mobile:** A simple single-column layout with 24px (xl) side margins.
- **Gaps:** Use 40px vertical gaps between distinct components and 80px between major content sections. 

The philosophy is "White Space as a Divider." Avoid thin lines or borders where a 32px or 80px gap can communicate the separation of concerns.

## Elevation & Depth

This system is **strictly flat**. Depth is communicated through color-blocking and layering of shapes rather than physical metaphors.

1.  **Tonal Stacking:** Use the transition from Cream (#fcf5eb) to White (#ffffff) to indicate interactive containers or cards.
2.  **Color Inversion:** High-impact sections (like security or privacy stories) use a deep black background with white text to signal a change in context.
3.  **Outlines:** Buttons and inputs use a 1px solid ink (#1c1e21) border. There are no soft shadows or blurs.
4.  **Z-Indexing:** Components like notification badges or contact chips should appear to "sit" on top of content through sharp contrast, not drop shadows.

## Shapes

The shape language is binary: elements are either **heavily rounded tiles** or **perfect pills**. 

- **Tiles (25px):** Used for large containers, hero images, and chat bubbles. This creates a friendly, approachable frame for content.
- **Pills (50px / 999px):** Used for all interactive elements, including buttons, search inputs, and chips.
- **Circles (50%):** Strictly reserved for avatars and notification badges.

This "no middle ground" approach to corner radii ensures the UI feels cohesive and intentional.

## Components

### Buttons
- **Primary:** Pill-shaped, #25d366 background, 1px #1c1e21 border, #1c1e21 text.
- **Secondary:** Pill-shaped, transparent background, 1px #1c1e21 border, #1c1e21 text.

### Chat Bubbles
- **Incoming:** 25px rounded tile, #ffffff background, #1c1e21 text. Left-aligned.
- **Outgoing:** 25px rounded tile, #e6ffda (Secondary) background, #1c1e21 text. Right-aligned.
- **Bubble Tail:** Minimalist geometric triangle at the bottom corner, matching the bubble color.

### Notification Badges
- **Style:** Circular (50% radius), #25d366 background.
- **Text:** 11px (label-xs) ink text, centered.

### Call Controls
- **Container:** A dark-mode inspired floating bar or full-screen overlay (#000000).
- **Icons:** Circular buttons (50%) with 1px white borders.
- **End Call:** Circular red button (#ff3b30), no border, white icon.

### Input Fields
- **Style:** 50px pill-shape, #ffffff background, 1px #1c1e21 border.
- **Placeholder text:** #5e5e5e (ink-muted) in Thai.

### Contact Chips
- **Style:** 50% radius (circular), #ffffff background, 8px horizontal padding.
- **Contents:** Avatar on left, Body-MD text on right.