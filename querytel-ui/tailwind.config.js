/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-dark': '#0f172a', // Slate 900
                'brand-primary': '#3b82f6', // Blue 500
                'brand-secondary': '#64748b', // Slate 500
                'status-error': '#ef4444',
                'status-warning': '#f59e0b',
                'status-success': '#10b981',
                'status-info': '#3b82f6',
            }
        },
    },
    plugins: [],
}
