/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const retroPrimary = "#FFB400"; // Warm yellow
const retroSecondary = "#FF6F61"; // Coral red
const retroAccent = "#2E8B57"; // Deep purple
const retroBackgroundLight = "#FDF3E7"; // Cream
const retroBackgroundDark = "#2E1A47"; // Deep plum
const retroTextLight = "#4A4A4A"; // Dark gray
const retroTextDark = "#EDEDED"; // Light gray

export const Colors = {
  light: {
    text: retroTextLight,
    background: retroBackgroundLight,
    tint: retroPrimary,
    icon: retroSecondary,
    tabIconDefault: retroSecondary,
    tabIconSelected: retroPrimary,
  },
  dark: {
    text: retroTextDark,
    background: retroBackgroundDark,
    tint: retroPrimary,
    icon: retroAccent,
    tabIconDefault: retroAccent,
    tabIconSelected: retroPrimary,
  },
};
