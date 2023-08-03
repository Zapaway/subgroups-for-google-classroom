const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      }
    },
    fontFamily: {
      "sans": [...defaultTheme.fontFamily.sans],
      "serif": [...defaultTheme.fontFamily.serif],
      "mono": [...defaultTheme.fontFamily.mono],
      "gc-font": "'Roboto', sans-serif"
    }
  },
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["[data-theme=light]"],
          "secondary": "#646464",
          "secondary-content": "#FFFFFF"        
        }
      }
    ]
  },
  prefix: '',
  plugins: [require("daisyui")],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
}
