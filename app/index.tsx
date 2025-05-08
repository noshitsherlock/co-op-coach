import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useProgress } from "../context/ProgressContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";

export default function HomeScreen() {
  const { progress } = useProgress();

  const exercises: Array<{
    id: string;
    title: string;
    description: string;
    screen: "/camera-control" | "/jump-timing" | "/dual-control";
    icon:
      | "videocam-outline"
      | "trending-up-outline"
      | "game-controller-outline";
    color: string;
  }> = [
    {
      id: "camera",
      title: "Kamerakontroll",
      description: "Lär dig att styra kameran samtidigt som du rör dig",
      screen: "/camera-control",
      icon: "videocam-outline",
      color: "#FF6B6B",
    },
    {
      id: "jump",
      title: "Hopptiming",
      description: "Träna på att hoppa med rätt timing",
      screen: "/jump-timing",
      icon: "trending-up-outline",
      color: "#4ECDC4",
    },
    {
      id: "dual",
      title: "Dubbla kontroller",
      description: "Lär dig att använda båda joystickarna samtidigt",
      screen: "/dual-control",
      icon: "game-controller-outline",
      color: "#FFD166",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>
          Träna dina spelkunskaper för bättre couch co-op upplevelser!
        </Text>
      </View>

      <ScrollView style={styles.exerciseList}>
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[styles.exerciseCard, { borderLeftColor: exercise.color }]}
            onPress={() => router.push(exercise.screen)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: exercise.color },
              ]}
            >
              <Ionicons name={exercise.icon} size={28} color="white" />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseTitle}>{exercise.title}</Text>
              <Text style={styles.exerciseDescription}>
                {exercise.description}
              </Text>
              {progress[exercise.id] ? (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progress[exercise.id], 100)}%` },
                    ]}
                  />
                  <Text style={styles.progressText}>
                    {progress[exercise.id]}%
                  </Text>
                </View>
              ) : (
                <Text style={styles.notStarted}>Inte påbörjad</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.progressButton}
        onPress={() => router.push("/progress")}
      >
        <Ionicons name="stats-chart-outline" size={20} color="white" />
        <Text style={styles.progressButtonText}>Se dina framsteg</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.icon,
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  exerciseList: {
    padding: 15,
  },
  exerciseCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    backgroundColor: Colors.light.icon,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 5,
  },
  exerciseDescription: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 10,
  },
  progressBar: {
    height: 15,
    backgroundColor: "#E0E0E0",
    borderRadius: 7.5,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2E8B57",
    borderRadius: 7.5,
  },
  progressText: {
    position: "absolute",
    right: 5,
    top: 0,
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  notStarted: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  progressButton: {
    flexDirection: "row",
    backgroundColor: "#2E8B57",
    padding: 15,
    borderRadius: 10,
    margin: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  progressButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 10,
  },
});
