import { Text, View, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export default function Wordmark() {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>Pwnshop</Text>
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  text: {
    color: COLORS.primary,
    fontFamily: "Syne_800ExtraBold",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -2.1,
    lineHeight: 34,
  },
  dot: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    height: 10,
    marginLeft: 4,
    marginTop: -8,
    width: 10,
  },
});