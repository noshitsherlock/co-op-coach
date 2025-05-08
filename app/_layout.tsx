import { Stack } from "expo-router";
import { ProgressProvider } from "../context/ProgressContext";

export default function Layout() {
  return (
    <ProgressProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#2E8B57",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "Couch Co-op Training" }}
        />
        <Stack.Screen
          name="camera-control"
          options={{ title: "Camera Control" }}
        />
        <Stack.Screen name="jump-timing" options={{ title: "Jump Timing" }} />
        <Stack.Screen name="dual-control" options={{ title: "Dual Control" }} />
        <Stack.Screen name="progress" options={{ title: "Your Progress" }} />
      </Stack>
    </ProgressProvider>
  );
}
