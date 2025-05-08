import { useEffect, useState } from "react";
import { ColorSchemeName } from "react-native";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): NonNullable<ColorSchemeName> {
  // Initialize with a default value to avoid hydration issues
  const [theme, setTheme] = useState<NonNullable<ColorSchemeName>>("light");

  // Only run on client-side
  useEffect(() => {
    // Function to update the theme based on media query
    function updateTheme() {
      if (typeof window === "undefined") return;
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(isDark ? "dark" : "light");
    }

    // Initialize theme
    updateTheme();

    // Set up event listener for theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => updateTheme();

    // Use the correct event listener method
    mediaQuery.addEventListener("change", listener);

    // Clean up
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return theme;
}
