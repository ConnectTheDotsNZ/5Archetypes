import type { Config } from "tailwindcss";

// Brand tokens pulled from fivearchetypes.com — see docs/BUILD_PLAN.md Section 8.
// Treat as a starting point; Carey has final sign-off on the palette.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brick: "#8C2B1E",
        gold: "#B8925A",
        cream: "#FBF7F2",
        blush: "#F1E3DC",
        ink: "#1F1F1F",
        muted: "#5A5A5A",
        wood: "#5B7B4F",
        fire: "#C1502E",
        earth: "#C7A24C",
        metal: "#8C8C94",
        water: "#3E6E8E",
      },
      fontFamily: {
        display: ["Georgia", "Playfair Display", "serif"],
        body: ["system-ui", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
