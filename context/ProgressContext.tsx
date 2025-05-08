"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

type ProgressContextType = {
  progress: Record<string, number>
  updateProgress: (exerciseId: string, value: number) => void
}

const ProgressContext = createContext<ProgressContextType>({
  progress: {},
  updateProgress: () => {},
})

export const useProgress = () => useContext(ProgressContext)

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load progress from AsyncStorage when the app starts
    const loadProgress = async () => {
      try {
        setIsLoading(true)
        const savedProgress = await AsyncStorage.getItem("progress")
        if (savedProgress) {
          setProgress(JSON.parse(savedProgress))
        }
      } catch (error) {
        console.error("Failed to load progress:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [])

  // Use useCallback to memoize the updateProgress function
  const updateProgress = useCallback(async (exerciseId: string, value: number) => {
    // Only update if the new value is higher than the current one
    setProgress(prevProgress => {
      const currentValue = prevProgress[exerciseId] || 0
      if (value <= currentValue) {
        return prevProgress // No change needed
      }
      
      // Create new progress object with updated value
      const newProgress = {
        ...prevProgress,
        [exerciseId]: value
      }
      
      // Save to AsyncStorage outside of render cycle
      setTimeout(() => {
        AsyncStorage.setItem("progress", JSON.stringify(newProgress))
          .catch(error => console.error("Failed to save progress:", error))
      }, 0)
      
      return newProgress
    })
  }, [])

  if (isLoading) {
    return null // Or a loading indicator
  }

  return <ProgressContext.Provider value={{ progress, updateProgress }}>{children}</ProgressContext.Provider>
}