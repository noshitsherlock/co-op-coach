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
import { Easing } from "react-native";
import { Platform } from "react-native";

const { width, height } = Dimensions.get("window");

export default function JumpTimingScreen() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [canJump, setCanJump] = useState(true);
  const [comboCount, setComboCount] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium"); // Default selected difficulty
  const [showComboText, setShowComboText] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpSafetyWindow, setJumpSafetyWindow] = useState(false);
  const jumpDuration = 1000; // Time in ms for the entire jump (matches animation duration)
  const jumpSafetyTimerRef = useRef(null);
  const jumpSafetyWindowRef = useRef(false);
  const { updateProgress } = useProgress();

  // Character animation
  const characterY = useRef(new Animated.Value(0)).current;
  const characterScale = useRef(new Animated.Value(1)).current;

  // Animation for combo text
  const comboTextOpacity = useRef(new Animated.Value(0)).current;
  const comboTextScale = useRef(new Animated.Value(0.5)).current;

  // Background elements
  const [backgroundElements, setBackgroundElements] = useState([]);

  // Track obstacles with their own state
  const [obstacles, setObstacles] = useState([]);

  // Track last obstacle spawn time to ensure proper spacing
  const lastObstacleTime = useRef(0);

  // Refs for game area dimensions
  const gameAreaRef = useRef(null);
  const [gameAreaHeight, setGameAreaHeight] = useState(0);

  // Update difficulty settings
  const difficultySettings = {
    easy: {
      obstacleTypes: ["normal"],
      minSpacing: 3500, // Increased from 3000
      baseSpeed: 2, // Reduced from 2.5
      speedIncrease: 0,
      spawnRate: 0.3, // Reduced from 0.4
    },
    medium: {
      obstacleTypes: ["normal", "normal", "normal", "tall"],
      minSpacing: 3000, // Increased from 2500
      baseSpeed: 2.5, // Reduced from 3
      speedIncrease: 0.1,
      spawnRate: 0.4, // Reduced from 0.5
    },
    hard: {
      obstacleTypes: ["normal", "normal", "tall", "tall"],
      minSpacing: 2500, // Increased from 2000
      baseSpeed: 3, // Reduced from 3.5
      speedIncrease: 0.15, // Reduced from 0.2
      spawnRate: 0.5, // Reduced from 0.6
    },
  };

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      // Clean up jump safety timer
      if (jumpSafetyTimerRef.current) {
        clearTimeout(jumpSafetyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Special iOS handling to ensure safety window eventually resets
    // even if timers don't work properly
    if (Platform.OS === "ios" && jumpSafetyWindow) {
      const backupResetTimer = setTimeout(() => {
        console.log("BACKUP RESET: Forcing safety window to FALSE");
        setJumpSafetyWindow(false);
      }, jumpDuration * 1.5); // 50% longer than jump duration

      return () => clearTimeout(backupResetTimer);
    }
  }, [jumpSafetyWindow]);

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

      // Get current difficulty settings
      const settings = difficultySettings[selectedDifficulty];

      // Generate obstacles with proper spacing
      const obstacleInterval = setInterval(() => {
        const now = Date.now();
        const timeSinceLastObstacle = now - lastObstacleTime.current;

        // Only spawn if enough time has passed since last obstacle
        if (timeSinceLastObstacle >= settings.minSpacing) {
          // Apply spawn rate chance
          if (Math.random() < settings.spawnRate) {
            // Select obstacle type based on difficulty
            const obstacleTypeIndex = Math.floor(
              Math.random() * settings.obstacleTypes.length
            );
            const obstacleType = settings.obstacleTypes[obstacleTypeIndex];

            // Calculate speed based on difficulty and time elapsed
            const timeElapsed = 60 - timeLeft;
            const speedIncrease = Math.min(
              (timeElapsed / 10) * settings.speedIncrease,
              3
            );
            const speed = settings.baseSpeed + speedIncrease;

            const newObstacle = {
              id: Date.now(),
              position: width,
              width: obstacleType === "tall" ? 30 : 40,
              height: obstacleType === "tall" ? 60 : 30,
              type: obstacleType,
              speed: speed,
              scored: false,
              collided: false,
            };

            setObstacles((prev) => [...prev, newObstacle]);
            lastObstacleTime.current = now;
          }
        }
      }, 500); // Check frequently but spawn based on minSpacing

      // Generate background elements
      const bgInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          const newElement = {
            id: Date.now(),
            position: width,
            y: Math.random() * 50 + 10, // Random height above ground
            size: Math.random() * 20 + 10,
            speed: 1 + Math.random() * 2, // Slower than obstacles for parallax effect
          };
          setBackgroundElements((prev) => [...prev, newElement]);
        }
      }, 1000);

      // Move obstacles and check collisions
      const gameLoopInterval = setInterval(() => {
        // Move background elements
        setBackgroundElements((prev) => {
          const updatedElements = prev.map((element) => ({
            ...element,
            position: element.position - element.speed,
          }));
          return updatedElements.filter(
            (element) => element.position > -element.size
          );
        });

        // Move obstacles and check collisions
        setObstacles((prev) => {
          // Move all obstacles to the left
          const updatedObstacles = prev.map((obstacle) => ({
            ...obstacle,
            position: obstacle.position - obstacle.speed,
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
        clearInterval(bgInterval);
      };
    }
  }, [isPlaying, selectedDifficulty, timeLeft]);

  // Function to check collisions and handle scoring
  const checkCollisionsAndScoring = () => {
    // Get current character Y position
    const characterYValue = characterY.__getValue();

    // Character horizontal position (fixed)
    const characterLeft = 70;
    const characterRight = 110; // 70 + 40 (width)

    setObstacles((prev) => {
      let hasCollision = false;
      let hasScored = false;

      const updatedObstacles = prev.map((obstacle) => {
        // If already scored or collided, just return as is
        if (obstacle.scored || obstacle.collided) {
          return obstacle;
        }

        // Obstacle position
        const obstacleLeft = obstacle.position;
        const obstacleRight = obstacle.position + obstacle.width;

        // SCORING: If obstacle has completely passed the character
        if (obstacleRight < characterLeft) {
          hasScored = true;
          return { ...obstacle, scored: true };
        }

        // Define the "critical zone" - the area where collision is possible
        // Only check collision when obstacle is directly under the character
        const inCollisionZone =
          obstacleLeft <= characterRight && obstacleRight >= characterLeft;

        if (inCollisionZone) {
          if (Platform.OS === "ios") {
            // Use the ref for immediate logic
            if (!jumpSafetyWindowRef.current) {
              console.log(
                "COLLISION (iOS): jumpSafetyWindowRef:",
                jumpSafetyWindowRef.current
              );
              hasCollision = true;
              return { ...obstacle, collided: true };
            } else {
              console.log("SAFE (iOS): jumpSafetyWindowRef active");
              return obstacle;
            }
          } else {
            // On web/Android, use the animated value as before
            const requiredHeight = obstacle.type === "tall" ? 40 : 20;
            if (characterYValue < requiredHeight) {
              hasCollision = true;
              return { ...obstacle, collided: true };
            }
          }
        }

        return obstacle;
      });

      if (hasCollision) {
        // Visual feedback for collision
        Animated.sequence([
          Animated.timing(characterScale, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(characterScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        setComboCount(0);
        // End game on collision
        setTimeout(() => endGame(), 0);
      }

      if (hasScored) {
        // Increment score and combo
        setScore((prev) => prev + 1);
        setComboCount((prev) => prev + 1);

        // Show combo text for consecutive jumps
        if (comboCount >= 2) {
          setShowComboText(true);
          Animated.parallel([
            Animated.timing(comboTextOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(comboTextScale, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setTimeout(() => {
              Animated.parallel([
                Animated.timing(comboTextOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(comboTextScale, {
                  toValue: 0.5,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                setShowComboText(false);
              });
            }, 800);
          });
        }
      }

      return updatedObstacles;
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(60);
    setScore(0);
    setObstacles([]);
    setBackgroundElements([]);
    setComboCount(0);
    lastObstacleTime.current = Date.now();

    // Measure game area height
    if (gameAreaRef.current) {
      gameAreaRef.current.measure((x, y, width, height) => {
        setGameAreaHeight(height);
      });
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
    }

    // Calculate progress percentage (assuming 30 is a perfect score)
    const progressPercentage = Math.min(100, Math.round((score / 30) * 100));
    updateProgress("jump", progressPercentage);
  };

  const jump = () => {
    if (canJump) {
      setCanJump(false);

      // Set ref immediately for logic, and state for UI/debug
      jumpSafetyWindowRef.current = true;
      setJumpSafetyWindow(true);
      console.log("JUMP START: Setting safety window to TRUE");

      if (jumpSafetyTimerRef.current) {
        clearTimeout(jumpSafetyTimerRef.current);
        jumpSafetyTimerRef.current = null;
      }

      // Much higher jump with longer duration
      Animated.sequence([
        Animated.timing(characterY, {
          toValue: 250,
          duration: jumpDuration / 2,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(characterY, {
          toValue: 0,
          duration: jumpDuration / 2,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCanJump(true);
        setIsJumping(false);
        // DO NOT reset safety window here - let the timer handle it
        console.log("JUMP ANIMATION COMPLETE");
      });

      // Create a new timer with a longer duration to ensure it works
      const timer = setTimeout(() => {
        jumpSafetyWindowRef.current = false;
        console.log("SAFETY WINDOW TIMEOUT: Setting safety window to FALSE");
        setJumpSafetyWindow(false);
      }, jumpDuration + 100); // Add buffer time

      // Store the timer ID
      jumpSafetyTimerRef.current = timer;

      // Squash and stretch animation
      Animated.sequence([
        Animated.timing(characterScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(characterScale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(characterScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Render difficulty selection button
  const renderDifficultyButton = (difficulty, label) => {
    const isSelected = selectedDifficulty === difficulty;
    return (
      <TouchableOpacity
        style={[
          styles.difficultyButton,
          isSelected && styles.selectedDifficultyButton,
          difficulty === "easy" && styles.easyButton,
          difficulty === "medium" && styles.mediumButton,
          difficulty === "hard" && styles.hardButton,
        ]}
        onPress={() => setSelectedDifficulty(difficulty)}
      >
        <Text
          style={[
            styles.difficultyButtonText,
            isSelected && styles.selectedDifficultyText,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
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
            ref={gameAreaRef}
          >
            {/* Background elements */}
            {backgroundElements.map((element) => (
              <View
                key={element.id}
                style={[
                  styles.backgroundElement,
                  {
                    left: element.position,
                    bottom: 50 + element.y,
                    width: element.size,
                    height: element.size,
                    opacity: 0.5,
                  },
                ]}
              />
            ))}
            {/* Ground with texture */}
            <View style={styles.ground}>
              <View style={styles.groundTexture} />
            </View>
            {/* Jump height indicators */}
            <View style={[styles.jumpIndicator, { bottom: 50 + 15 }]}>
              <Text style={styles.jumpIndicatorText}>Normal</Text>
            </View>
            <View style={[styles.jumpIndicator, { bottom: 50 + 30 }]}>
              <Text style={styles.jumpIndicatorText}>Tall</Text>
            </View>
            {/* Character */}
            <Animated.View
              style={[
                styles.character,
                {
                  transform: [
                    { translateY: Animated.multiply(characterY, -1) },
                    { scaleX: characterScale },
                    { scaleY: characterScale },
                  ],
                  left: 70,
                },
              ]}
            >
              <Ionicons
                name="person"
                size={40}
                color={characterY.__getValue() > 0 ? "#4CAF50" : "#2E8B57"}
              />
              {canJump && <View style={styles.jumpReadyIndicator} />}
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
                      ? "#4CAF50"
                      : obstacle.collided
                      ? "#F44336"
                      : "#FF9800",
                    borderRadius: obstacle.type === "tall" ? 5 : 8,
                  },
                ]}
              />
            ))}
            {/* Combo text animation */}
            {showComboText && (
              <Animated.View
                style={[
                  styles.comboText,
                  {
                    opacity: comboTextOpacity,
                    transform: [{ scale: comboTextScale }],
                  },
                ]}
              >
                <Text style={styles.comboTextContent}>
                  Combo x{comboCount}!
                </Text>
              </Animated.View>
            )}
            {/* Difficulty indicator */}
            <View style={styles.difficultyIndicator}>
              <Text style={styles.difficultyText}>
                Nivå:{" "}
                {selectedDifficulty === "easy"
                  ? "Lätt"
                  : selectedDifficulty === "medium"
                  ? "Medel"
                  : "Svår"}
              </Text>
            </View>
            {/* Dedicated Jump Button */}
            <TouchableOpacity
              style={styles.jumpButton}
              activeOpacity={0.7}
              onPress={jump}
            >
              <Text style={styles.jumpButtonText}>HOPPA!</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <View style={styles.startScreen}>
            <Text style={styles.highScoreText}>Högsta poäng: {highScore}</Text>

            {/* Difficulty selection */}
            <View style={styles.difficultySelection}>
              <Text style={styles.difficultyTitle}>Välj svårighetsgrad:</Text>
              <View style={styles.difficultyButtons}>
                {renderDifficultyButton("easy", "Lätt")}
                {renderDifficultyButton("medium", "Medel")}
                {renderDifficultyButton("hard", "Svår")}
              </View>

              <View style={styles.difficultyDescription}>
                {selectedDifficulty === "easy" && (
                  <Text style={styles.difficultyDescText}>
                    Bara fyrkantiga hinder med gott om utrymme mellan dem.
                  </Text>
                )}
                {selectedDifficulty === "medium" && (
                  <Text style={styles.difficultyDescText}>
                    Blandning av fyrkantiga och höga hinder med måttligt utrymme
                    mellan dem.
                  </Text>
                )}
                {selectedDifficulty === "hard" && (
                  <Text style={styles.difficultyDescText}>
                    Fler höga hinder, tätare placering och snabbare hastighet.
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>Starta träning</Text>
            </TouchableOpacity>

            <Text style={styles.instructionDetail}>
              I detta övningsmoment ska du lära dig att hoppa med rätt timing.
              Tryck på skärmen för att hoppa över hindren som kommer mot dig.
            </Text>

            <View style={styles.tipContainer}>
              <Text style={styles.tipTitle}>Tips:</Text>
              <Text style={styles.tipText}>
                • Fyrkantiga hinder kräver lägre hopp
              </Text>
              <Text style={styles.tipText}>
                • Höga hinder kräver högre hopp
              </Text>
              <Text style={styles.tipText}>
                • Försök att bygga upp en combo för extra poäng
              </Text>
            </View>
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
    backgroundColor: "#87CEEB", // Sky blue background
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
    backgroundColor: "#8B4513", // Brown ground
  },
  groundTexture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: "#556B2F", // Dark green grass
  },
  backgroundElement: {
    position: "absolute",
    backgroundColor: "#556B2F", // Dark green for bushes/plants
    borderRadius: 10,
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
    borderRadius: 5,
  },
  comboText: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  comboTextContent: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700", // Gold color
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  difficultyIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
    borderRadius: 5,
  },
  difficultyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
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
  difficultySelection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  difficultyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  difficultyButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  difficultyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: "#E0E0E0",
  },
  selectedDifficultyButton: {
    borderWidth: 2,
    borderColor: "#2E8B57",
  },
  easyButton: {
    backgroundColor: "#A5D6A7", // Light green
  },
  mediumButton: {
    backgroundColor: "#FFE082", // Light yellow
  },
  hardButton: {
    backgroundColor: "#EF9A9A", // Light red
  },
  difficultyButtonText: {
    fontWeight: "bold",
  },
  selectedDifficultyText: {
    color: "#2E8B57",
  },
  difficultyDescription: {
    width: "90%",
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 5,
    marginBottom: 10,
  },
  difficultyDescText: {
    textAlign: "center",
    fontSize: 14,
    color: "#555",
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
    marginBottom: 20,
  },
  tipContainer: {
    backgroundColor: "#E0E0E0",
    padding: 15,
    borderRadius: 10,
    width: "90%",
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  // Add to the styles StyleSheet
  jumpButton: {
    position: "absolute",
    bottom: 70,
    right: 20,
    backgroundColor: "#2E8B57",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  jumpButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  jumpIndicator: {
    position: "absolute",
    left: 10,
    height: 1,
    width: 50,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  jumpIndicatorText: {
    position: "absolute",
    left: 0,
    top: 2,
    color: "white",
    fontSize: 10,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  jumpReadyIndicator: {
    position: "absolute",
    bottom: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
  },
});
