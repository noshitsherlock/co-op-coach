import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return (
    <View
      style={[
        {
          backgroundColor,
          borderRadius: 10,
          padding: 10,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}
