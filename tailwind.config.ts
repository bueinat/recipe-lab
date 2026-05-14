import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fff7ed",
        herb: "#2f6f4e",
        tomato: "#e85d4f",
      },
    },
  },
  plugins: [],
};

export default config;
