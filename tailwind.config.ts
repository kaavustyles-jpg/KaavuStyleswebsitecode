import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#F8F3EC",
          50: "#FDFBF7",
          100: "#F8F3EC",
          200: "#F0E6D9",
          300: "#E5D9CC",
          400: "#D6C4B0",
        },
        crimson: {
          DEFAULT: "#5E1A2D",
          50: "#FDF4F6",
          100: "#F9E4E8",
          600: "#7A2A3D",
          700: "#5E1A2D",
          800: "#45121F",
          900: "#2B0B14",
        },
        burgundy: {
          DEFAULT: "#4A1222",
          50: "#FAF0F2",
          100: "#F4DCE2",
          600: "#6E1F35",
          700: "#4A1222",
          800: "#380D1A",
          900: "#220810",
        },
        gold: {
          DEFAULT: "#8F6E3A",
          light: "#C9A86A",
          dark: "#664E26",
        },
        ink: {
          DEFAULT: "#2B1A1F",
          muted: "#7A6864",
          light: "#3A2A2F",
        },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Jost", "system-ui", "sans-serif"],
        mono: ["Jost", "system-ui", "monospace"],
      },
      boxShadow: {
        luxury: "0 22px 40px rgba(60, 20, 30, 0.12)",
        drawer: "-24px 0 60px rgba(50, 18, 28, 0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
