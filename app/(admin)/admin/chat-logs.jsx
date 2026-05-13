import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../constants/colors";
import { getAdminChatLogs } from "../../../api/admin";

export default function AdminChatLogsScreen() {
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 20 : 0;
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAdminChatLogs()
      .then((response) => setLogs(response.data || []))
      .catch((error) => setMessage(error.message || "Unable to load chat logs"));
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 30 + bottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat Logs</Text>
        <Text style={styles.subtitle}>Conversation traces captured by backend.</Text>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {(logs || []).map((log) => (
        <View key={log.id} style={styles.card}>
          <Text style={styles.name}>Message: {log.message || "(empty)"}</Text>
          <Text style={styles.meta}>Reply: {log.reply || "(empty)"}</Text>
          <Text style={styles.meta}>{new Date(log.createdAt).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16,  paddingTop: 54 },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 5 },
  message: { color: COLORS.primary, marginTop: 10 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 12 },
  name: { color: COLORS.text, fontWeight: "700" },
  meta: { color: COLORS.muted, marginTop: 4, fontSize: 12 },
});
