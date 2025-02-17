/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Game-specific colors
        correct: '#4ade80',    // green-400
        partial: '#facc15',    // yellow
        incorrect: '#f87171',  // red-400
        // Card colors for types
        'type-normal': '#A8A878',
        'type-fire': '#F08030',
        'type-water': '#6890F0',
        'type-grass': '#78C850',
        'type-electric': '#F8D030',
        'type-ice': '#98D8D8',
        'type-fighting': '#C03028',
        'type-poison': '#A040A0',
        'type-ground': '#E0C068',
        'type-flying': '#A890F0',
        'type-psychic': '#F85888',
        'type-bug': '#A8B820',
        'type-rock': '#B8A038',
        'type-ghost': '#705898',
        'type-dark': '#705848',
        'type-dragon': '#7038F8',
        'type-steel': '#B8B8D0',
        'type-fairy': '#F0B6BC',
      },
      borderRadius: {
        'card': '1rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}