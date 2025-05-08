import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useProgress } from "../context/ProgressContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

export default function ProgressScreen() {
  const { progress } = useProgress();

  const exercises: Array<{
    id: string;
    title: string;
    description: string;
    icon:
      | "videocam-outline"
      | "trending-up-outline"
      | "game-controller-outline";
    color: string;
  }> = [
    {
      id: "camera",
      title: "Kamerakontroll",
      description: "Styr kameran samtidigt som du rör dig",
      icon: "videocam-outline",
      color: "#FF6B6B",
    },
    {
      id: "jump",
      title: "Hopptiming",
      description: "Hoppa med rätt timing",
      icon: "trending-up-outline",
      color: "#4ECDC4",
    },
    {
      id: "dual",
      title: "Dubbla kontroller",
      description: "Använd båda joystickarna samtidigt",
      icon: "game-controller-outline",
      color: "#FFD166",
    },
  ];

  const getTotalProgress = () => {
    const total = Object.values(progress).reduce(
      (sum, value) => sum + value,
      0
    );
    return Math.round(total / (Object.keys(progress).length || 1));
  };

  const getSkillLevel = (percent: number): string => {
    if (percent >= 90) return "Expert";
    if (percent >= 70) return "Avancerad";
    if (percent >= 50) return "Medel";
    if (percent >= 30) return "Nybörjare";
    if (percent > 0) return "Novis";
    return "Inte påbörjad";
  };

  const getSkillColor = (percent: number): string => {
    if (percent >= 90) return "#4CAF50";
    if (percent >= 70) return "#8BC34A";
    if (percent >= 50) return "#CDDC39";
    if (percent >= 30) return "#FFC107";
    if (percent > 0) return "#FF9800";
    return "#9E9E9E";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.totalProgressContainer}>
          <Text style={styles.totalProgressTitle}>Total framsteg</Text>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercent}>{getTotalProgress()}%</Text>
          </View>
          <Text style={styles.skillLevel}>
            Nivå: {getSkillLevel(getTotalProgress())}
          </Text>
        </View>
      </View>

      <View style={styles.exerciseList}>
        <Text style={styles.sectionTitle}>Dina färdigheter</Text>

        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: exercise.color },
              ]}
            >
              <Ionicons name={exercise.icon} size={24} color="white" />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseTitle}>{exercise.title}</Text>
              <Text style={styles.exerciseDescription}>
                {exercise.description}
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress[exercise.id] || 0}%`,
                        backgroundColor: getSkillColor(
                          progress[exercise.id] || 0
                        ),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {progress[exercise.id] || 0}%
                </Text>
              </View>
              <Text
                style={[
                  styles.skillLevelText,
                  { color: getSkillColor(progress[exercise.id] || 0) },
                ]}
              >
                {getSkillLevel(progress[exercise.id] || 0)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>
          Tips för att förbättra dina färdigheter
        </Text>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Kamerakontroll</Text>
          <Text style={styles.tipText}>
            • Öva på att röra höger tumme utan att titta på den{"\n"}• Försök
            att hålla kameran centrerad medan du rör dig{"\n"}• Justera
            känsligheten om det känns för svårt
          </Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Hopptiming</Text>
          <Text style={styles.tipText}>
            • Försök att förutse när du behöver hoppa{"\n"}• Vänta inte för
            länge innan du hoppar{"\n"}• Öva på att hoppa i rytm med spelet
          </Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Dubbla kontroller</Text>
          <Text style={styles.tipText}>
            • Börja med små rörelser med båda tummarna{"\n"}• Fokusera på en
            kontroll i taget tills du känner dig bekväm
            {"\n"}• Öva på att röra båda kontrollerna i olika riktningar
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.icon,
  },
  totalProgressContainer: {
    alignItems: "center",
  },
  totalProgressTitle: {
    fontSize: 20,
    color: Colors.light.text,
    marginBottom: 10,
    fontWeight: "bold",
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.icon,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  skillLevel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  exerciseList: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 15,
  },
  exerciseCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
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
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  exerciseDescription: {
    fontSize: 14,
    color: Colors.light.text,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "bold",
    width: 40,
    textAlign: "right",
  },
  skillLevelText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  tipsSection: {
    padding: 20,
  },
  tipCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
});
