import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

const THEME_ORDER = ["light", "dark", "ocean", "sunset", "forest"];

const THEME_LABELS = {
  light: "Light",
  dark: "Dark",
  ocean: "Ocean",
  sunset: "Sunset",
  forest: "Forest",
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    return THEME_ORDER.includes(storedTheme) ? storedTheme : "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previousTheme) => {
      const currentIndex = THEME_ORDER.indexOf(previousTheme);
      const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
      return THEME_ORDER[nextIndex];
    });
  };

  const selectTheme = (nextTheme) => {
    if (THEME_ORDER.includes(nextTheme)) {
      setTheme(nextTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, selectTheme, themes: THEME_ORDER, themeLabels: THEME_LABELS }}>
      {children}
    </ThemeContext.Provider>
  );
};
