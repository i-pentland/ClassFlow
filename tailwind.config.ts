import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(200 18% 86%)",
        input: "hsl(200 18% 86%)",
        ring: "hsl(197 52% 47%)",
        background: "hsl(204 33% 98%)",
        foreground: "hsl(212 34% 17%)",
        primary: {
          DEFAULT: "hsl(197 52% 47%)",
          foreground: "hsl(210 40% 98%)",
        },
        secondary: {
          DEFAULT: "hsl(190 30% 92%)",
          foreground: "hsl(212 34% 17%)",
        },
        muted: {
          DEFAULT: "hsl(190 20% 94%)",
          foreground: "hsl(215 16% 40%)",
        },
        accent: {
          DEFAULT: "hsl(42 75% 93%)",
          foreground: "hsl(24 40% 24%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(212 34% 17%)",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      boxShadow: {
        gentle: "0 18px 50px -28px rgba(31, 62, 81, 0.35)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(116, 187, 197, 0.35), transparent 38%), linear-gradient(180deg, rgba(247, 250, 251, 1) 0%, rgba(240, 245, 246, 1) 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
