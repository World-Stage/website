"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// Legacy simple theme toggle (keeping for backward compatibility)
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <SunIcon className="w-5 h-5 block dark:hidden" />
      <MoonIcon className="w-5 h-5 hidden dark:block" />
    </button>
  );
}

// New dropdown-style theme toggle component
export function DropdownThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    // Cycle through: light -> dark -> system -> light
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // Get the current effective theme for display
  const getCurrentThemeDisplay = () => {
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? 'dark' : 'light';
    }
    return theme;
  };

  const currentThemeDisplay = getCurrentThemeDisplay();

  return (
    <button 
      onClick={toggleTheme}
      className="flex items-center w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="w-5 h-5 mr-3 flex items-center justify-center">
        {currentThemeDisplay === 'dark' ? (
          <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        ) : (
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        )}
      </div>
      <span>
        {theme === 'system' ? 'System Theme' : theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
      </span>
    </button>
  );
} 