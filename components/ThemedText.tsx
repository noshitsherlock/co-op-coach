import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
  // Add a prop to indicate if retro styles should be used, or decide based on another factor
  useRetroStyles?: boolean;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  useRetroStyles = false, // Default to false, or manage this prop as needed
  ...rest
}: ThemedTextProps) {
  // Determine the base color using useThemeColor
  const themedTextColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "text"
  );
  const themedTintColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "tint"
  );

  // Define base styles that don't depend on the hook directly
  const baseStyles = {
    default: styles.default,
    title: styles.title,
    defaultSemiBold: styles.defaultSemiBold,
    subtitle: styles.subtitle,
    link: styles.link,
  };

  // Define retro styles dynamically if needed
  const retroStyleObject = useRetroStyles
    ? {
        default: {
          fontSize: 16,
          lineHeight: 24,
          color: themedTextColor,
        },
        title: {
          fontSize: 32,
          fontWeight: "bold",
          lineHeight: 40,
          color: themedTextColor,
        },
        subtitle: {
          fontSize: 20,
          fontWeight: "600",
          lineHeight: 28,
          color: themedTextColor,
        },
        link: {
          fontSize: 16,
          lineHeight: 24,
          color: themedTintColor,
          textDecorationLine: "underline",
        },
      }
    : {};

  const currentStyles = useRetroStyles ? retroStyleObject : baseStyles;

  return (
    <Text
      style={[
        // Apply the base color if not using retro styles or if retro styles don't override
        !useRetroStyles && { color: themedTextColor },
        currentStyles[type],
        style, // Allow overriding with passed-in style
      ]}
      {...rest}
    />
  );
}

// These styles are static and don't use hooks
const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    // Static color, or make it themeable via props if needed
    // If this link color should also be theme-dependent,
    // you'd set it dynamically like the retroStyles colors.
    color: "#0a7ea4",
  },
});
