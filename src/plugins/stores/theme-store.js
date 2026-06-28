// theme-store.js
import { defineStore } from "pinia";
import { GRADIENTS, DEFAULT_GRADIENT, gradientCss } from "@/utils/gradients.js";

const randomGradientId = () =>
  GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)].id;

export const useThemeStore = defineStore("theme", {
  state: () => ({
    isDark: true,
    currentLanguage: "tr",
    // `background` is the saved preference: a gradient id or "random".
    background: DEFAULT_GRADIENT,
    // `activeGradient` is the concrete gradient shown this session.
    activeGradient: DEFAULT_GRADIENT,
    // page (area) change animation: "slide" | "fade" | "zoom" | "none"
    pageAnimation: "slide",
  }),

  getters: {
    backgroundCss: (state) => gradientCss(state.activeGradient),
  },

  actions: {
    applyTheme() {
      document.documentElement.classList.toggle("dark", this.isDark);
    },

    toggleDarkMode() {
      this.isDark = !this.isDark;
      localStorage.setItem("darkMode", this.isDark);
      this.applyTheme();
    },

    setBackground(id) {
      if (id === "random") {
        this.background = "random";
        this.activeGradient = randomGradientId();
      } else {
        if (!GRADIENTS.some((g) => g.id === id)) return;
        this.background = id;
        this.activeGradient = id;
      }
      localStorage.setItem("background", this.background);
    },

    setPageAnimation(value) {
      const allowed = ["slide", "fade", "zoom", "none"];
      if (!allowed.includes(value)) return;
      this.pageAnimation = value;
      localStorage.setItem("pageAnimation", value);
    },

    setLanguage(lang) {
      if (this.currentLanguage === lang) {
        return;
      }

      this.currentLanguage = lang;

      localStorage.setItem("language", lang);

      document.documentElement.setAttribute("lang", lang);

      window.dispatchEvent(
        new CustomEvent("language-changed", {
          detail: { language: lang },
        })
      );
    },

    initSettings() {
      const savedTheme = localStorage.getItem("darkMode");
      const savedLanguage = localStorage.getItem("language");
      const savedBackground = localStorage.getItem("background");

      if (savedTheme !== null) {
        this.isDark = savedTheme === "true";
      } else {
        this.isDark = true;
        localStorage.setItem("darkMode", "true");
      }

      if (savedLanguage) {
        this.currentLanguage = savedLanguage;
      } else {
        this.currentLanguage = "tr";
        localStorage.setItem("language", "tr");
      }

      if (savedBackground === "random") {
        this.background = "random";
        this.activeGradient = randomGradientId();
      } else if (savedBackground && GRADIENTS.some((g) => g.id === savedBackground)) {
        this.background = savedBackground;
        this.activeGradient = savedBackground;
      } else {
        this.background = DEFAULT_GRADIENT;
        this.activeGradient = DEFAULT_GRADIENT;
        localStorage.setItem("background", this.background);
      }

      const savedAnimation = localStorage.getItem("pageAnimation");
      if (savedAnimation && ["slide", "fade", "zoom", "none"].includes(savedAnimation)) {
        this.pageAnimation = savedAnimation;
      }

      this.applyTheme();
      document.documentElement.setAttribute("lang", this.currentLanguage);
    },
  },
});
