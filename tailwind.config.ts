import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        background: "#fff8f0",
        canvas: "#fcf5eb",
        surface: "#fff8f0",
        "surface-dim": "#e0d9d0",
        "surface-bright": "#fff8f0",
        "surface-white": "#ffffff",
        "surface-dark": "#1c1e21", // near-black ink per design.md (not pure #000)
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#faf3e9",
        "surface-container": "#f4ede3",
        "surface-container-high": "#eee7dd",
        "surface-container-highest": "#e8e2d8",
        "surface-variant": "#e8e2d8",
        "surface-tint": "#25d366",
        // Ink / on-surface
        ink: "#1c1e21",
        "ink-muted": "#5e5e5e",
        "ink-inverse": "#ffffff",
        "on-surface": "#1e1b16",
        "on-surface-variant": "#3c4a3d",
        "on-background": "#1e1b16",
        // Inverse
        "inverse-surface": "#33302a",
        "inverse-on-surface": "#f7f0e6",
        "inverse-primary": "#3de273",
        // Primary — Arm Chat brand (per design.md + landing HTML)
        primary: "#006d2f", // deep green — text accents, active states
        "primary-container": "#25d366", // bright voltage green — CTA pill bg
        "on-primary": "#ffffff",
        "on-primary-container": "#1c1e21", // ink on bright green (legsibility per design.md)
        "primary-fixed": "#66ff8e",
        "primary-fixed-dim": "#3de273",
        "on-primary-fixed": "#002109",
        "on-primary-fixed-variant": "#005322",
        // Secondary
        secondary: "#4f6448",
        "secondary-container": "#d1eac6",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#556a4d",
        "secondary-fixed": "#d1eac6",
        "secondary-fixed-dim": "#b5cdab",
        "on-secondary-fixed": "#0d200a",
        "on-secondary-fixed-variant": "#384c32",
        // Tertiary
        tertiary: "#005cbd",
        "tertiary-container": "#93b8ff",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#004694",
        "tertiary-fixed": "#d7e2ff",
        "tertiary-fixed-dim": "#abc7ff",
        "on-tertiary-fixed": "#001b3f",
        "on-tertiary-fixed-variant": "#004590",
        // Error
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        // Outline
        outline: "#6c7b6b",
        "outline-variant": "#bbcbb9",
      },
      borderRadius: {
        tile: "25px",
        card: "28px",
        "card-lg": "32px",
        bubble: "22px",
        pill: "50px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "Prompt", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        prompt: ["Prompt", "Inter", "sans-serif"],
      },
      fontSize: {
        // Display
        "display-xl": ["80px", { lineHeight: "80px", letterSpacing: "-0.02em" }],
        "display-xl-mobile": ["48px", { lineHeight: "52px", letterSpacing: "-0.01em" }],
        "display-lg": ["60px", { lineHeight: "60px" }],
        "display-md": ["48px", { lineHeight: "48px" }],
        // Body
        "body-lg": ["18px", { lineHeight: "25px" }],
        "body-md": ["16px", { lineHeight: "22px" }],
        // Button
        "button-md": ["16px", { lineHeight: "16px" }],
        // Label
        "label-sm": ["12px", { lineHeight: "15.6px" }],
        "label-xs": ["11px", { lineHeight: "12px" }],
      },
      spacing: {
        base: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        xxl: "32px",
        huge: "80px",
      },
      boxShadow: {
        pip: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "status-ring":
          "conic-gradient(from 180deg at 50% 50%, #25d366 0deg, #25d366 90deg, #ffffff 90deg, #ffffff 180deg, #25d366 180deg, #25d366 270deg, #ffffff 270deg, #ffffff 360deg)",
      },
    },
  },
  plugins: [],
};

export default config;