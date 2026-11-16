import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "#0B0F14",
        bush: "#121A22",
        gold: {
          DEFAULT: "#E8B923",
          glow: "#F5C84B",
        },
        moon: "#F4F1EA",
        mist: "#A8B2C1",
        success: "#2DD4A8",
        danger: "#F87171",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;