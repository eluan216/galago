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
        night: "#0A0C10",
        surface: {
          DEFAULT: "#12161C",
          2: "#181C24",
        },
        border: "rgba(255,255,255,0.06)",
        moon: "#F2F0EA",
        mist: "#8B93A7",
        gold: {
          DEFAULT: "#E8B923",
          soft: "rgba(232,185,35,0.12)",
        },
        success: "#2DD4A8",
        danger: "#F87171",
        // legacy aliases used in older pages
        bush: "#12161C",
      },
      borderRadius: {
        card: "8px",
      },
      fontSize: {
        display: ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "600" }],
      },
      transitionDuration: {
        DEFAULT: "160ms",
      },
    },
  },
  plugins: [],
};

export default config;
