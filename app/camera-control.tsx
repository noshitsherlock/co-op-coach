"use client";

import { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProgress } from "../context/ProgressContext";

export default function CameraControlScreen() {
  const [targetPosition, setTargetPosition] = useState({ x: 150, y: 150 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const { updateProgress } = useProgress();

  // Track touch IDs for each joystick
  const [leftTouchId, setLeftTouchId] = useState(null);
  const [rightTouchId, setRightTouchId] = useState(null);

  // Track joystick positions
  const [leftPosition, setLeftPosition] = useState({ x: 0, y: 0 });
  const [rightPosition, setRightPosition] = useState({ x: 0, y: 0 });

  // Character and camera positions
  const [characterPosition, setCharacterPosition] = useState({
    x: 150,
    y: 150,
  });
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

  // Refs for joystick base positions
  const leftBaseRef = useRef(null);
  const rightBaseRef = useRef(null);
  const gameWorldRef = useRef(null);
  const [leftBasePosition, setLeftBasePosition] = useState({ x: 0, y: 0 });
  const [rightBasePosition, setRightBasePosition] = useState({ x: 0, y: 0 });
  const [gameWorldSize, setGameWorldSize] = useState({ width: 0, height: 0 });

  // Joystick settings
  const JOYSTICK_MAX_RADIUS = 40;

  // Measure game world size after layout
  useEffect(() => {
    if (isPlaying && gameWorldRef.current) {
      setTimeout(() => {
        gameWorldRef.current.measure((x, y, width, height, pageX, pageY) => {
          setGameWorldSize({ width, height });
        });
      }, 100);
    }
  }, [isPlaying]);

  // Measure joystick positions after layout
  useEffect(() => {
    if (isPlaying) {
      setTimeout(() => {
        // Measure joystick positions
        leftBaseRef.current?.measure((x, y, width, height, pageX, pageY) => {
          setLeftBasePosition({
            x: pageX + width / 2,
            y: pageY + height / 2,
          });
        });
        rightBaseRef.current?.measure((x, y, width, height, pageX, pageY) => {
          setRightBasePosition({
            x: pageX + width / 2,
            y: pageY + height / 2,
          });
        });
      }, 100);
    }
  }, [isPlaying]);

  // Update character and camera positions based on joystick inputs
  useEffect(() => {
    if (isPlaying && gameWorldSize.width > 0) {
      // Update character position based on left joystick
      const newX = Math.max(
        20,
        Math.min(
          gameWorldSize.width - 20,
          characterPosition.x + leftPosition.x * 0.5
        )
      );
      const newY = Math.max(
        20,
        Math.min(
          gameWorldSize.height - 20,
          characterPosition.y + leftPosition.y * 0.5
        )
      );

      setCharacterPosition({ x: newX, y: newY });

      // Update camera offset based on right joystick
      setCameraOffset({
        x: rightPosition.x * 2,
        y: rightPosition.y * 2,
      });
    }
  }, [leftPosition, rightPosition, isPlaying, gameWorldSize]);

  useEffect(() => {
    if (isPlaying) {
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

      // Move target randomly every 3 seconds
      const targetInterval = setInterval(() => {
        if (gameWorldSize.width > 0) {
          setTargetPosition({
            x: 20 + Math.random() * (gameWorldSize.width - 40),
            y: 20 + Math.random() * (gameWorldSize.height - 40),
          });
        }
      }, 3000);

      // Check if character is looking at target
      const checkInterval = setInterval(() => {
        // Calculate if the camera is pointing at the target
        const cameraViewX = characterPosition.x + cameraOffset.x;
        const cameraViewY = characterPosition.y + cameraOffset.y;

        const isLookingAtTarget =
          Math.abs(cameraViewX - targetPosition.x) < 50 &&
          Math.abs(cameraViewY - targetPosition.y) < 50;

        if (isLookingAtTarget) {
          setScore((prev) => prev + 1);
        }
      }, 500);

      return () => {
        clearInterval(interval);
        clearInterval(targetInterval);
        clearInterval(checkInterval);
      };
    }
  }, [
    isPlaying,
    targetPosition,
    characterPosition,
    cameraOffset,
    gameWorldSize,
  ]);

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(60);
    setScore(0);
    setCharacterPosition({ x: 150, y: 150 });
    setCameraOffset({ x: 0, y: 0 });
    setLeftPosition({ x: 0, y: 0 });
    setRightPosition({ x: 0, y: 0 });
  };

  const endGame = () => {
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
    }

    // Calculate progress percentage (assuming 50 is a perfect score)
    const progressPercentage = Math.min(100, Math.round((score / 50) * 100));
    updateProgress("camera", progressPercentage);
  };

  // Handle touch events for left joystick
  const handleLeftTouchStart = (event) => {
    if (leftTouchId === null) {
      const touch = event.nativeEvent.touches[0];
      setLeftTouchId(touch.identifier);
      updateLeftJoystickPosition(touch.pageX, touch.pageY);
    }
  };

  const handleLeftTouchMove = (event) => {
    if (leftTouchId !== null) {
      for (let i = 0; i < event.nativeEvent.touches.length; i++) {
        const touch = event.nativeEvent.touches[i];
        if (touch.identifier === leftTouchId) {
          updateLeftJoystickPosition(touch.pageX, touch.pageY);
          break;
        }
      }
    }
  };

  const handleLeftTouchEnd = (event) => {
    let touchFound = false;

    // Check if our tracked touch is still active
    for (let i = 0; i < event.nativeEvent.touches.length; i++) {
      if (event.nativeEvent.touches[i].identifier === leftTouchId) {
        touchFound = true;
        break;
      }
    }

    if (!touchFound) {
      setLeftTouchId(null);
      setLeftPosition({ x: 0, y: 0 });
    }
  };

  // Handle touch events for right joystick
  const handleRightTouchStart = (event) => {
    if (rightTouchId === null) {
      const touch = event.nativeEvent.touches[0];
      setRightTouchId(touch.identifier);
      updateRightJoystickPosition(touch.pageX, touch.pageY);
    }
  };

  const handleRightTouchMove = (event) => {
    if (rightTouchId !== null) {
      for (let i = 0; i < event.nativeEvent.touches.length; i++) {
        const touch = event.nativeEvent.touches[i];
        if (touch.identifier === rightTouchId) {
          updateRightJoystickPosition(touch.pageX, touch.pageY);
          break;
        }
      }
    }
  };

  const handleRightTouchEnd = (event) => {
    let touchFound = false;

    // Check if our tracked touch is still active
    for (let i = 0; i < event.nativeEvent.touches.length; i++) {
      if (event.nativeEvent.touches[i].identifier === rightTouchId) {
        touchFound = true;
        break;
      }
    }

    if (!touchFound) {
      setRightTouchId(null);
      setRightPosition({ x: 0, y: 0 });
    }
  };

  // Update joystick positions with constraints
  const updateLeftJoystickPosition = (touchX, touchY) => {
    if (leftBasePosition.x === 0) return; // Base not measured yet

    let dx = touchX - leftBasePosition.x;
    let dy = touchY - leftBasePosition.y;

    // Limit to a circle with radius JOYSTICK_MAX_RADIUS
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > JOYSTICK_MAX_RADIUS) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * JOYSTICK_MAX_RADIUS;
      dy = Math.sin(angle) * JOYSTICK_MAX_RADIUS;
    }

    setLeftPosition({ x: dx, y: dy });
  };

  const updateRightJoystickPosition = (touchX, touchY) => {
    if (rightBasePosition.x === 0) return; // Base not measured yet

    let dx = touchX - rightBasePosition.x;
    let dy = touchY - rightBasePosition.y;

    // Limit to a circle with radius JOYSTICK_MAX_RADIUS
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > JOYSTICK_MAX_RADIUS) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * JOYSTICK_MAX_RADIUS;
      dy = Math.sin(angle) * JOYSTICK_MAX_RADIUS;
    }

    setRightPosition({ x: dx, y: dy });
  };

  // Calculate camera view position
  const getCameraViewPosition = () => {
    return {
      x: characterPosition.x + cameraOffset.x,
      y: characterPosition.y + cameraOffset.y,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoBar}>
        <Text style={styles.scoreText}>Poäng: {score}</Text>
        <Text style={styles.timeText}>Tid: {timeLeft}s</Text>
      </View>

      <View style={styles.gameContainer}>
        <Text style={styles.instructionText}>
          Styr karaktären med vänster sida och kameran med höger sida för att
          hålla målet i sikte
        </Text>

        {isPlaying ? (
          <View style={styles.gameArea}>
            {/* The game world */}
            <View
              ref={gameWorldRef}
              style={styles.worldContainer}
              onLayout={() => {
                // Force measurement on layout
                if (gameWorldRef.current) {
                  gameWorldRef.current.measure(
                    (x, y, width, height, pageX, pageY) => {
                      setGameWorldSize({ width, height });
                    }
                  );
                }
              }}
            >
              {/* Target to look at */}
              <View
                style={[
                  styles.target,
                  { left: targetPosition.x, top: targetPosition.y },
                ]}
              />

              {/* Character that player controls */}
              <View
                style={[
                  styles.character,
                  { left: characterPosition.x, top: characterPosition.y },
                ]}
              >
                <Ionicons name="person" size={30} color="#2E8B57" />
              </View>

              {/* Camera view indicator */}
              <View
                style={[
                  styles.cameraView,
                  {
                    left: getCameraViewPosition().x,
                    top: getCameraViewPosition().y,
                  },
                ]}
              />

              {/* Line connecting character to camera view */}
              <View
                style={[
                  styles.cameraLine,
                  {
                    left: characterPosition.x,
                    top: characterPosition.y,
                    width: Math.sqrt(
                      Math.pow(cameraOffset.x, 2) + Math.pow(cameraOffset.y, 2)
                    ),
                    transform: [
                      {
                        rotate: `${Math.atan2(
                          cameraOffset.y,
                          cameraOffset.x
                        )}rad`,
                      },
                    ],
                  },
                ]}
              />
            </View>

            <View style={styles.controlsContainer}>
              {/* Left joystick */}
              <View style={styles.joystickSide}>
                <View
                  ref={leftBaseRef}
                  style={styles.joystickBase}
                  onTouchStart={handleLeftTouchStart}
                  onTouchMove={handleLeftTouchMove}
                  onTouchEnd={handleLeftTouchEnd}
                >
                  <View
                    style={[
                      styles.joystickHandle,
                      {
                        transform: [
                          { translateX: leftPosition.x },
                          { translateY: leftPosition.y },
                        ],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.joystickLabel}>Rörelse</Text>
              </View>

              {/* Right joystick */}
              <View style={styles.joystickSide}>
                <View
                  ref={rightBaseRef}
                  style={styles.joystickBase}
                  onTouchStart={handleRightTouchStart}
                  onTouchMove={handleRightTouchMove}
                  onTouchEnd={handleRightTouchEnd}
                >
                  <View
                    style={[
                      styles.joystickHandle,
                      {
                        transform: [
                          { translateX: rightPosition.x },
                          { translateY: rightPosition.y },
                        ],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.joystickLabel}>Kamera</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.startScreen}>
            <Text style={styles.highScoreText}>Högsta poäng: {highScore}</Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>Starta träning</Text>
            </TouchableOpacity>
            <Text style={styles.instructionDetail}>
              I detta övningsmoment ska du lära dig att styra både din karaktär
              och kameran samtidigt. Håll målet i sikte medan du rör dig runt i
              världen.
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
  },
  worldContainer: {
    flex: 2,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    position: "relative",
    overflow: "hidden",
  },
  target: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "red",
    marginLeft: -15,
    marginTop: -15,
  },
  character: {
    position: "absolute",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -20,
    marginTop: -20,
  },
  cameraView: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2E8B57",
    backgroundColor: "rgba(106, 13, 173, 0.3)",
    marginLeft: -10,
    marginTop: -10,
  },
  cameraLine: {
    position: "absolute",
    height: 2,
    backgroundColor: "rgba(106, 13, 173, 0.5)",
    transformOrigin: "left center",
  },
  controlsContainer: {
    flex: 1,
    flexDirection: "row",
    marginTop: 15,
  },
  joystickSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  joystickBase: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  joystickHandle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2E8B57",
  },
  joystickLabel: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
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
});
