"use client";

import { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useProgress } from "../context/ProgressContext";

export default function DualControlScreen() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [targets, setTargets] = useState([]);
  const { updateProgress } = useProgress();

  // Game world dimensions - make sure these match the actual rendered size
  const GAME_WIDTH = 280;
  const GAME_HEIGHT = 280;

  // Track touch IDs for each joystick
  const [leftTouchId, setLeftTouchId] = useState(null);
  const [rightTouchId, setRightTouchId] = useState(null);

  // Track joystick positions
  const [leftPosition, setLeftPosition] = useState({ x: 0, y: 0 });
  const [rightPosition, setRightPosition] = useState({ x: 0, y: 0 });

  // Track indicator positions in game world coordinates
  // Force initial position to be exactly center
  const [leftIndicator, setLeftIndicator] = useState({ x: 140, y: 140 });
  const [rightIndicator, setRightIndicator] = useState({ x: 140, y: 140 });

  // Refs for joystick base positions
  const leftBaseRef = useRef(null);
  const rightBaseRef = useRef(null);
  const gameWorldRef = useRef(null);
  const [leftBasePosition, setLeftBasePosition] = useState({ x: 0, y: 0 });
  const [rightBasePosition, setRightBasePosition] = useState({ x: 0, y: 0 });

  // Debug state to show actual dimensions
  const [gameWorldSize, setGameWorldSize] = useState({ width: 0, height: 0 });

  // Joystick settings
  const JOYSTICK_MAX_RADIUS = 40;

  // Measure game world size after layout
  useEffect(() => {
    if (isPlaying && gameWorldRef.current) {
      setTimeout(() => {
        gameWorldRef.current.measure((x, y, width, height, pageX, pageY) => {
          setGameWorldSize({ width, height });

          // Reset indicators to the true center based on measured dimensions
          setLeftIndicator({ x: width / 2, y: height / 2 });
          setRightIndicator({ x: width / 2, y: height / 2 });
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

  // Update indicator positions whenever joystick positions change
  useEffect(() => {
    if (isPlaying && gameWorldSize.width > 0) {
      // Use the actual measured game world size for mapping
      const centerX = gameWorldSize.width / 2;
      const centerY = gameWorldSize.height / 2;

      // Map left joystick to game world
      const leftX = mapJoystickToGameX(
        leftPosition.x,
        centerX,
        gameWorldSize.width
      );
      const leftY = mapJoystickToGameY(
        leftPosition.y,
        centerY,
        gameWorldSize.height
      );
      setLeftIndicator({ x: leftX, y: leftY });

      // Map right joystick to game world
      const rightX = mapJoystickToGameX(
        rightPosition.x,
        centerX,
        gameWorldSize.width
      );
      const rightY = mapJoystickToGameY(
        rightPosition.y,
        centerY,
        gameWorldSize.height
      );
      setRightIndicator({ x: rightX, y: rightY });
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

      // Generate targets
      const targetInterval = setInterval(() => {
        if (targets.length < 3 && gameWorldSize.width > 0) {
          // Create targets with a margin from the edges
          const margin = 30;
          const newTarget = {
            id: Date.now(),
            x: margin + Math.random() * (gameWorldSize.width - 2 * margin),
            y: margin + Math.random() * (gameWorldSize.height - 2 * margin),
            size: 20 + Math.random() * 20,
            color: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(
              Math.random() * 255
            )}, ${Math.floor(Math.random() * 255)})`,
          };

          setTargets((prev) => [...prev, newTarget]);
        }
      }, 2000);

      // Check if both sticks are pointing at a target
      const checkInterval = setInterval(() => {
        targets.forEach((target) => {
          const leftDistance = Math.sqrt(
            Math.pow(leftIndicator.x - target.x, 2) +
              Math.pow(leftIndicator.y - target.y, 2)
          );

          const rightDistance = Math.sqrt(
            Math.pow(rightIndicator.x - target.x, 2) +
              Math.pow(rightIndicator.y - target.y, 2)
          );

          // If both sticks are pointing close to the target
          if (
            leftDistance < target.size * 1.5 &&
            rightDistance < target.size * 1.5
          ) {
            setScore((prev) => prev + 1);
            setTargets((prev) => prev.filter((t) => t.id !== target.id));
          }
        });
      }, 100);

      return () => {
        clearInterval(interval);
        clearInterval(targetInterval);
        clearInterval(checkInterval);
      };
    }
  }, [isPlaying, targets, leftIndicator, rightIndicator, gameWorldSize]);

  // Map joystick X position to game world X coordinate
  const mapJoystickToGameX = (joystickX, centerX, worldWidth) => {
    // Normalize joystick position to -1 to 1 range
    const normalizedX = joystickX / JOYSTICK_MAX_RADIUS;

    // Map to game world with constraints
    return Math.max(
      0,
      Math.min(worldWidth, centerX + normalizedX * (worldWidth / 2))
    );
  };

  // Map joystick Y position to game world Y coordinate
  const mapJoystickToGameY = (joystickY, centerY, worldHeight) => {
    // Normalize joystick position to -1 to 1 range
    const normalizedY = joystickY / JOYSTICK_MAX_RADIUS;

    // Map to game world with constraints
    return Math.max(
      10,
      Math.min(worldHeight - 10, centerY + normalizedY * (worldHeight / 2 - 10))
    );
  };

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(60);
    setScore(0);
    setTargets([]);
    setLeftPosition({ x: 0, y: 0 });
    setRightPosition({ x: 0, y: 0 });

    // Reset indicators to center - we'll update with actual measurements later
    setLeftIndicator({ x: 140, y: 140 });
    setRightIndicator({ x: 140, y: 140 });
  };

  const endGame = () => {
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
    }

    // Calculate progress percentage (assuming 25 is a perfect score)
    const progressPercentage = Math.min(100, Math.round((score / 25) * 100));

    // Use setTimeout to ensure this happens outside the render cycle
    setTimeout(() => {
      updateProgress("dual", progressPercentage);
    }, 0);
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

  // Render reference points to visualize coverage
  const renderReferencePoints = () => {
    const points = [];
    const spacing = 70; // Space between points

    // Create a grid of points
    for (let x = spacing; x < gameWorldSize.width; x += spacing) {
      for (let y = spacing; y < gameWorldSize.height; y += spacing) {
        points.push(
          <View
            key={`point-${x}-${y}`}
            style={[
              styles.referencePoint,
              {
                left: x,
                top: y,
                backgroundColor: "rgba(0,0,0,0.2)",
              },
            ]}
          />
        );
      }
    }

    // Add corner points
    points.push(
      <View
        key="top-left"
        style={[
          styles.referencePoint,
          {
            left: 10,
            top: 10,
            backgroundColor: "red",
            width: 8,
            height: 8,
          },
        ]}
      />
    );

    points.push(
      <View
        key="top-right"
        style={[
          styles.referencePoint,
          {
            right: 10,
            top: 10,
            backgroundColor: "red",
            width: 8,
            height: 8,
          },
        ]}
      />
    );

    points.push(
      <View
        key="bottom-left"
        style={[
          styles.referencePoint,
          {
            left: 10,
            bottom: 10,
            backgroundColor: "red",
            width: 8,
            height: 8,
          },
        ]}
      />
    );

    points.push(
      <View
        key="bottom-right"
        style={[
          styles.referencePoint,
          {
            right: 10,
            bottom: 10,
            backgroundColor: "red",
            width: 8,
            height: 8,
          },
        ]}
      />
    );

    // Add center point for reference
    if (gameWorldSize.width > 0) {
      points.push(
        <View
          key="center"
          style={[
            styles.referencePoint,
            {
              left: gameWorldSize.width / 2,
              top: gameWorldSize.height / 2,
              backgroundColor: "yellow",
              width: 8,
              height: 8,
            },
          ]}
        />
      );
    }

    return points;
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoBar}>
        <Text style={styles.scoreText}>Poäng: {score}</Text>
        <Text style={styles.timeText}>Tid: {timeLeft}s</Text>
      </View>

      <View style={styles.gameContainer}>
        <Text style={styles.instructionText}>
          Använd båda kontrollerna samtidigt för att peka på målen
        </Text>

        {isPlaying ? (
          <View style={styles.gameArea}>
            <View
              ref={gameWorldRef}
              style={styles.gameWorld}
              onLayout={() => {
                // Force measurement on layout
                if (gameWorldRef.current) {
                  gameWorldRef.current.measure(
                    (x, y, width, height, pageX, pageY) => {
                      setGameWorldSize({ width, height });

                      // Reset indicators to the true center based on measured dimensions
                      setLeftIndicator({ x: width / 2, y: height / 2 });
                      setRightIndicator({ x: width / 2, y: height / 2 });
                    }
                  );
                }
              }}
            >
              {/* Reference points */}
              {renderReferencePoints()}

              {/* Targets */}
              {targets.map((target) => (
                <View
                  key={target.id}
                  style={[
                    styles.target,
                    {
                      left: target.x,
                      top: target.y,
                      width: target.size,
                      height: target.size,
                      backgroundColor: target.color,
                    },
                  ]}
                />
              ))}

              {/* Left indicator (blue) */}
              <View
                style={[
                  styles.indicator,
                  {
                    left: leftIndicator.x,
                    top: leftIndicator.y,
                    backgroundColor: "blue",
                  },
                ]}
              />

              {/* Right indicator (red) */}
              <View
                style={[
                  styles.indicator,
                  {
                    left: rightIndicator.x,
                    top: rightIndicator.y,
                    backgroundColor: "red",
                  },
                ]}
              />

              {/* Game world boundaries visualization */}
              <View style={styles.gameWorldBorder} />
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
              I detta övningsmoment ska du lära dig att använda båda
              kontrollerna samtidigt. Peka på målen med både vänster och höger
              kontroll för att få poäng.
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
  gameWorld: {
    flex: 2,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    position: "relative",
    overflow: "hidden", // Important: clip indicators to game world
  },
  gameWorldBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
    pointerEvents: "none",
  },
  target: {
    position: "absolute",
    borderRadius: 50,
  },
  indicator: {
    position: "absolute",
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginLeft: -7.5,
    marginTop: -7.5,
  },
  referencePoint: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
    marginTop: -2,
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
