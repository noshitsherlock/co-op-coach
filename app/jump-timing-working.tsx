"use client";

import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProgress } from "../context/ProgressContext";

const { width } = Dimensions.get("window");

export default function JumpTimingScreen() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [canJump, setCanJump] = useState(true);
  const { updateProgress } = useProgress();

  // Character animation
  const characterY = useRef(new Animated.Value(0)).current;
  const gameSpeed = useRef(3000); // Time in ms for obstacle to cross screen

  // Track obstacles with their own state
  const [obstacles, setObstacles] = useState([]);

  // Debug info
  const [debugInfo, setDebugInfo] = useState("Not started");

  useEffect(() => {
    if (isPlaying) {
      // Timer for game time
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Generate obstacles
      const obstacleInterval = setInterval(() => {
        if (Math.random() > 0.3) {
          // 70% chance to spawn obstacle
          const newObstacle = {
            id: Date.now(),
            position: width,
            width: 30,
            height: 30,
            scored: false,
            collided: false,
          };

          setObstacles((prev) => [...prev, newObstacle]);
          setDebugInfo(`Added obstacle at ${width}`);
        }
      }, 2000);

      // Move obstacles and check collisions
      const gameLoopInterval = setInterval(() => {
        setObstacles((prev) => {
          // Move all obstacles to the left
          const updatedObstacles = prev.map((obstacle) => ({
            ...obstacle,
            position: obstacle.position - 5, // Move 5px per frame
          }));

          // Filter out obstacles that have moved off screen
          return updatedObstacles.filter(
            (obstacle) => obstacle.position > -obstacle.width
          );
        });

        // Check for collisions and scoring
        checkCollisionsAndScoring();
      }, 16); // ~60fps

      return () => {
        clearInterval(interval);
        clearInterval(obstacleInterval);
        clearInterval(gameLoopInterval);
      };
    }
  }, [isPlaying]);

  // Function to check collisions and handle scoring
  const checkCollisionsAndScoring = () => {
    // Get current character Y position
    const characterYValue = characterY.__getValue();

    setObstacles((prev) => {
      let hasCollision = false;

      // Check each obstacle
      const updatedObstacles = prev.map((obstacle) => {
        // Character position (fixed X)
        const characterLeft = 70;
        const characterRight = 110; // 70 + 40 (width)

        // Obstacle position
        const obstacleLeft = obstacle.position;
        const obstacleRight = obstacle.position + obstacle.width;

        // Check for horizontal overlap
        const horizontalOverlap =
          obstacleLeft < characterRight && obstacleRight > characterLeft;

        // If there's horizontal overlap
        if (horizontalOverlap && !obstacle.scored && !obstacle.collided) {
          // If character is not jumping high enough (less than 30px up)
          if (characterYValue < 30) {
            hasCollision = true;
            return { ...obstacle, collided: true };
          }
          // If character has cleared the obstacle
          else if (obstacleLeft < characterLeft) {
            setScore((prev) => prev + 1);
            setDebugInfo(`Scored! Jump height: ${characterYValue.toFixed(1)}`);
            return { ...obstacle, scored: true };
          }
        }

        return obstacle;
      });

      if (hasCollision) {
        setDebugInfo("Collision detected!");
        // End game on next tick to avoid state update during render
        setTimeout(() => endGame(), 0);
      }

      return updatedObstacles;
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(60);
    setScore(0);
    setObstacles([]);
    gameSpeed.current = 3000;
    setDebugInfo("Game started");
  };

  const endGame = () => {
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
    }

    // Calculate progress percentage (assuming 30 is a perfect score)
    const progressPercentage = Math.min(100, Math.round((score / 30) * 100));
    updateProgress("jump", progressPercentage);
    setDebugInfo("Game ended");
  };

  const jump = () => {
    if (canJump) {
      setCanJump(false);
      setDebugInfo("Jumping");

      Animated.sequence([
        Animated.timing(characterY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(characterY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCanJump(true);
        setDebugInfo("Jump completed");
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoBar}>
        <Text style={styles.scoreText}>Poäng: {score}</Text>
        <Text style={styles.timeText}>Tid: {timeLeft}s</Text>
      </View>

      <View style={styles.gameContainer}>
        <Text style={styles.instructionText}>
          Tryck på skärmen för att hoppa över hinder med rätt timing
        </Text>

        {isPlaying ? (
          <TouchableOpacity
            style={styles.gameArea}
            activeOpacity={1}
            onPress={jump}
          >
            <View style={styles.ground} />

            {/* Character */}
            <Animated.View
              style={[
                styles.character,
                {
                  transform: [
                    { translateY: Animated.multiply(characterY, -1) },
                  ],
                  left: 70,
                },
              ]}
            >
              <Ionicons name="person" size={40} color="#2E8B57" />
            </Animated.View>

            {/* Obstacles */}
            {obstacles.map((obstacle) => (
              <View
                key={obstacle.id}
                style={[
                  styles.obstacle,
                  {
                    left: obstacle.position,
                    width: obstacle.width,
                    height: obstacle.height,
                    backgroundColor: obstacle.scored
                      ? "green"
                      : obstacle.collided
                      ? "purple"
                      : "red",
                  },
                ]}
              />
            ))}

            {/* Debug info */}
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                {debugInfo}
                {"\n"}
                Obstacles: {obstacles.length}
                {"\n"}
                Character Y: {characterY.__getValue().toFixed(1)}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.startScreen}>
            <Text style={styles.highScoreText}>Högsta poäng: {highScore}</Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>Starta träning</Text>
            </TouchableOpacity>
            <Text style={styles.instructionDetail}>
              I detta övningsmoment ska du lära dig att hoppa med rätt timing.
              Tryck på skärmen för att hoppa över hindren som kommer mot dig.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  infoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#2E8B57",
  },
  scoreText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  timeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  gameContainer: {
    flex: 1,
    padding: 15,
  },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  gameArea: {
    flex: 1,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    position: "relative",
    overflow: "hidden",
  },
  ground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "#999",
  },
  character: {
    position: "absolute",
    bottom: 50,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  obstacle: {
    position: "absolute",
    bottom: 50,
    width: 30,
    height: 30,
    backgroundColor: "red",
    borderRadius: 5,
  },
  startScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  highScoreText: {
    fontSize: 20,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: "#2E8B57",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  instructionDetail: {
    textAlign: "center",
    paddingHorizontal: 20,
    color: "#666",
  },
  debugInfo: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    color: "white",
    fontSize: 10,
  },
});
