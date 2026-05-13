import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { broadcastAdminNotification, getAdminNotifications, sendAdminNotification } from "../../../api/admin";

function ts(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function AdminNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 20 : 0;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState("single");

  async function load() {
    setLoading(true);
    try {
      const res = await getAdminNotifications();
      setLogs(res.data || []);
    } catch (e) {
      setMessage(e.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSend() {
    if (!title.trim()) { setMessage("Title is required"); return; }
    if (mode === "single" && !userId.trim()) { setMessage("User ID is required for single send"); return; }
    setSending(true);
    setMessage("");
    try {
      if (mode === "broadcast") {
        const res = await broadcastAdminNotification({ title, body });
        setMessage(`Sent to ${res.data?.sent || 0} users.`);
      } else {
        await sendAdminNotification({ userId, title, body });
        setMessage(`Sent to user ${userId}.`);
      }
      setTitle(""); setBody(""); setUserId("");
      await load();
    } catch (e) {
      setMessage(e.message || "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 30 + bottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Management</Text>
        <Text style={styles.subtitle}>Send push notifications to individual users or broadcast to all.</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Send Notification</Text>

        <View style={styles.modeRow}>
          {[["single", "Single User"], ["broadcast", "All Users"]].map(([k, label]) => (
            <TouchableOpacity key={k} onPress={() => setMode(k)} style={[styles.modeBtn, mode === k && styles.modeBtnActive]}>
              <Text style={[styles.modeBtnText, mode === k && styles.modeBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === "single" && (
          <>
            <Text style={styles.label}>User ID</Text>
            <TextInput style={styles.input} value={userId} onChangeText={setUserId} placeholder="u1" placeholderTextColor={COLORS.muted} autoCapitalize="none" />
          </>
        )}

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Notification title" placeholderTextColor={COLORS.muted} />

        <Text style={styles.label}>Body (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={body}
          onChangeText={setBody}
          placeholder="Notification body text..."
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={3}
        />

        {message ? <Text style={styles.feedback}>{message}</Text> : null}

        <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={sending}>
          {sending ? <ActivityIndicator color="#fff" /> : (
            <View style={styles.sendInner}>
              <Ionicons name={mode === "broadcast" ? "megaphone-outline" : "send-outline"} size={16} color="#fff" />
              <Text style={styles.sendText}>{mode === "broadcast" ? "Broadcast to All Users" : "Send to User"}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Sent Notifications</Text>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
      ) : logs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={40} color={COLORS.muted} />
          <Text style={styles.emptyText}>No notifications sent yet.</Text>
        </View>
      ) : (
        logs.map((n) => (
          <View key={n.id} style={[styles.logCard, n.read && styles.logRead]}>
            <View style={styles.logRow}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>{n.title}</Text>
                {n.body ? <Text style={styles.logBody}>{n.body}</Text> : null}
              </View>
            </View>
            <Text style={styles.logMeta}>To: {n.userId} · {ts(n.createdAt)}</Text>
          </View>
        ))
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16,  paddingTop: 54 },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", fontSize: 12, marginTop: 5, lineHeight: 17 },
  formCard: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 12, borderWidth: 1, marginTop: 14, padding: 16 },
  formTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 16, marginBottom: 10 },
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: { alignItems: "center", borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, flex: 1, paddingVertical: 9 },
  modeBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  modeBtnText: { color: COLORS.muted, fontWeight: "700", fontSize: 13 },
  modeBtnTextActive: { color: "#fff" },
  label: { color: COLORS.muted, fontSize: 12, marginTop: 12 },
  input: { backgroundColor: "#fff", borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, color: COLORS.text, marginTop: 4, paddingHorizontal: 12, paddingVertical: 10 },
  multiline: { height: 72, textAlignVertical: "top" },
  feedback: { color: COLORS.primary, fontWeight: "600", marginTop: 10 },
  sendBtn: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 14, paddingVertical: 12 },
  sendInner: { alignItems: "center", flexDirection: "row", gap: 8 },
  sendText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  listHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  sectionTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 16 },
  refreshBtn: { padding: 4 },
  empty: { alignItems: "center", marginTop: 30 },
  emptyText: { color: COLORS.muted, fontSize: 14, marginTop: 8 },
  logCard: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 12 },
  logRead: { opacity: 0.65 },
  logRow: { alignItems: "flex-start", flexDirection: "row" },
  logTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  logBody: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  logMeta: { color: COLORS.muted, fontSize: 11, marginTop: 6 },
});
