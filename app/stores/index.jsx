import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { STORES } from "../../constants/stores";

export default function StoresScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Physical Stores</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.intro}>
          {STORES.length} Pwnshop locations across Nigeria. Walk in, pick up orders, or get support.
        </Text>

        {STORES.map((store) => (
          <View key={store.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.stateDot, { backgroundColor: store.stateColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{store.name}</Text>
                <Text style={styles.stateLabel}>{store.state} State</Text>
              </View>
              <Text style={styles.storeId}>{store.id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.muted} />
              <Text style={styles.infoText}>{store.address}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={14} color={COLORS.muted} />
              <Text style={styles.infoText}>{store.landmark}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.muted} />
              <Text style={styles.infoText}>{store.hours}</Text>
            </View>

            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${store.phone}`)}
              style={styles.callBtn}
            >
              <Ionicons name="call-outline" size={15} color="#fff" />
              <Text style={styles.callText}>{store.phone}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 54,
  },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700" },
  body: { padding: 16, paddingBottom: 32 },
  intro: { color: COLORS.muted, fontSize: 13, lineHeight: 18, marginBottom: 14 },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  cardTop: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 10 },
  stateDot: { borderRadius: 5, height: 10, width: 10 },
  name: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 15, fontWeight: "700" },
  stateLabel: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  storeId: { color: COLORS.muted, fontSize: 11 },
  infoRow: { alignItems: "flex-start", flexDirection: "row", gap: 6, marginBottom: 5 },
  infoText: { color: COLORS.text, flex: 1, fontSize: 13, lineHeight: 18 },
  callBtn: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 10,
  },
  callText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
