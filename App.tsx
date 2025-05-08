import { StyleSheet, View } from "react-native"
import HomeScreen from "./app/index"

export default function App() {
  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
})