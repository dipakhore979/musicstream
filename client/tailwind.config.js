/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1db954", hover: "#1ed760" },
        surface: {
          base: "#000000",
          DEFAULT: "#121212",
          raised: "#181818",
          highlight: "#282828",
        },
        muted: "#b3b3b3",
      },
      // Serif (Times) for headings, nav and cards; sans (Arial) for the sidebar list, inputs and buttons.
      // Both are system fonts, so nothing needs to be downloaded.
      fontFamily: {
        serif: ['"Times New Roman"', "Times", "serif"],
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
