import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { getAdminSecurityLogs } from "../../../api/admin";

const EVENT_META = {
  failed_login: { icon: "lock-closed-outline", color: "#B00020", label: "Failed Login" },
  banned_user_login_attempt: { icon: "ban-outline", color: "#B00020", label: "Banned User Attempt" },
  user_banned: { icon: "person-remove-outline", color: "#B00020", label: "User Banned" },
  user_unbanned: { icon: "person-add-outline", color: "#0B7A4B", label: "User Unbanned" },
  seller_banned: { icon: "storefront-outline", color: "#B00020", label: "Seller Banned" },
  seller_unbanned: { icon: "storefront-outline", color: "#0B7A4B", label: "Seller Unbanned" },
};

function ts(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function AdminSecurityLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await getAdminSecurityLogs();
      setLogs(res.data || []);
    } catch (e) {
      setMessage(e.message || "Unable to load security logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Security Logs</Text>
        <Text style={styles.subtitle}>Failed logins, bans, and suspicious events.</Text>
      </View>

      <TouchableOpacity onPress={load} style={styles.refreshBtn}>
        <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>

      {message ? <Text style={styles.error}>{message}</Text> : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={COLORS.primary} />
      ) : logs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="shield-checkmark-outline" size={48} color={COLORS.muted} />
          <Text style={styles.emptyText}>No security events recorded yet.</Text>
          <Text style={styles.emptyMeta}>Events appear here after failed logins or admin bans.</Text>
        </View>
      ) : (
        logs.map((log) => {
          const meta = EVENT_META[log.event] || { icon: "alert-circle-outline", color: COLORS.muted, label: log.event };
          return (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logRow}>
                <View style={[styles.iconWrap, { backgroundColor: meta.color + "18" }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logEvent, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={styles.logTime}>{ts(log.createdAt)}</Text>
                </View>
              </View>
              {log.email && <Text style={styles.logDetail}>Email: {log.email}</Text>}
              {log.userId && <Text style={styles.logDetail}>User ID: {log.userId}</Text>}
              {log.ip && <Text style={styles.logDetail}>IP: {log.ip}</Text>}
              {log.sellerId && <Text style={styles.logDetail}>Seller ID: {log.sellerId}</Text>}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingBottom: 40, paddingTop: 54 },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 5 },
  refreshBtn: { alignItems: "center", alignSelf: "flex-end", flexDirection: "row", gap: 6, marginTop: 12, paddingVertical: 6 },
  refreshText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  error: { color: "#B00020", marginTop: 10 },
  empty: { alignItems: "center", marginTop: 50, paddingHorizontal: 30 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyMeta: { color: COLORS.muted, fontSize: 13, marginTop: 6, textAlign: "center" },
  logCard: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 12 },
  logRow: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 4 },
  iconWrap: { alignItems: "center", borderRadius: 8, height: 36, justifyContent: "center", width: 36 },
  logEvent: { fontWeight: "700", fontSize: 14 },
  logTime: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
  logDetail: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
});
