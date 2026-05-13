import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../constants/colors";
import { getAdminVulnBankTransactions } from "../../../api/admin";

function money(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function AdminVulnBankLogsScreen() {
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 20 : 0;
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAdminVulnBankTransactions()
      .then((response) => setLogs(response.data || []))
      .catch((error) => setMessage(error.message || "Unable to load VulnBank logs"));
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 30 + bottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>VulnBank Transaction Logs</Text>
        <Text style={styles.subtitle}>Payment and transfer trails for admin review.</Text>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {(logs || []).map((log) => (
        <View key={log.id} style={styles.card}>
          <Text style={styles.name}>{log.type}</Text>
          <Text style={styles.meta}>Status: {log.status || "unknown"}</Text>
          <Text style={styles.meta}>Amount: {money(log.amount)}</Text>
          <Text style={styles.meta}>Ref: {log.accountRef || "n/a"}</Text>
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
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 5 },
  message: { color: COLORS.primary, marginTop: 10 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 12 },
  name: { color: COLORS.text, fontWeight: "700" },
  meta: { color: COLORS.muted, marginTop: 4, fontSize: 12 },
});
