/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0f172a',
        'brand-primary': '#3b82f6',
        'brand-secondary': '#64748b',
        'status-error': '#ef4444',
        'status-warning': '#f59e0b',
        'status-success': '#10b981',
        'status-info': '#3b82f6',

        // Legacy colors kept for compatibility
        primaryLink: "#4F6BED",
        card: "#ffffff",
        panel: "#f8fafc",
        borderColor: "#e2e8f0",
      },
      boxShadow: {
        soft: "0 4px 10px rgba(0,0,0,0.05)",
        glow: "0 0 8px rgba(79,107,237, .2)",
      },
    },
  },
  plugins: [],
};

