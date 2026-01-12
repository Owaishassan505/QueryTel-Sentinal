/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fluent UI Soft Colors
        primary: "#4F6BED",
        primarySoft: "#7287F5",
        card: "#1E1F24",
        panel: "#141416",
        borderColor: "#2A2B2F",

        // Severity Colors
        severity: {
          info: "#3B82F6",
          warning: "#FBBF24",
          error: "#EF4444",
        }
      },
      boxShadow: {
        soft: "0 4px 10px rgba(0,0,0,0.25)",
        glow: "0 0 8px rgba(79,107,237, .5)",
      },
    },
  },
  plugins: [],
};
