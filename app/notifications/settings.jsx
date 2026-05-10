import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { getSession } from "../../storage/insecure";
import { savePushToken, getPushNotifications } from "../../api/notifications";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [pushEnabled, setPushEnabled] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [notifDeals, setNotifDeals] = React.useState(true);
  const [notifOrders, setNotifOrders] = React.useState(true);
  const [notifAccount, setNotifAccount] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const { user: storedUser } = await getSession();
      if (mounted) {
        setUser(storedUser);
        if (storedUser) {
          const res = await getPushNotifications();
          if (res.ok && Array.isArray(res.data)) {
            setNotifications(res.data);
          }
        }
        setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, []);

  async function handleEnablePush(value) {
    if (value) {
      setLoading(true);
      const res = await savePushToken();
      setLoading(false);

      if (res.ok) {
        setPushEnabled(true);
        setMessage("✓ Push notifications enabled");
      } else {
        setMessage("Failed to enable push notifications");
      }
    } else {
      setPushEnabled(false);
      setMessage("Push notifications disabled");
    }
  }

  if (!user) {
    return (
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons color="#fff" name="arrow-back" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={{ color: COLORS.muted }}>Sign in to manage notifications</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Switch value={pushEnabled} onValueChange={handleEnablePush} />
            )}
          </View>
          <Text style={styles.sectionDescription}>
            Receive real-time updates about orders, deals, and account activity
          </Text>
        </View>

        {message && (
          <View style={[styles.message, message.includes("✓") ? styles.messageSuccess : styles.messageError]}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        {pushEnabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Types</Text>
              <View style={styles.notificationOption}>
                <Ionicons name="gift" size={20} color={COLORS.primary} />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Deals & Promotions</Text>
                  <Text style={styles.optionDescription}>Get notified about special offers</Text>
                </View>
                <Switch value={notifDeals} onValueChange={setNotifDeals} trackColor={{ true: COLORS.primary }} />
              </View>
              <View style={styles.notificationOption}>
                <Ionicons name="cube" size={20} color={COLORS.primary} />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Order Updates</Text>
                  <Text style={styles.optionDescription}>Track your shipments</Text>
                </View>
                <Switch value={notifOrders} onValueChange={setNotifOrders} trackColor={{ true: COLORS.primary }} />
              </View>
              <View style={styles.notificationOption}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Account Activity</Text>
                  <Text style={styles.optionDescription}>Security and login alerts</Text>
                </View>
                <Switch value={notifAccount} onValueChange={setNotifAccount} trackColor={{ true: COLORS.primary }} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Notifications</Text>
              {notifications.length === 0 ? (
                <Text style={styles.emptyText}>No notifications yet</Text>
              ) : (
                notifications.map((notif, idx) => (
                  <View key={idx} style={styles.notificationCard}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifBody}>{notif.body}</Text>
                    <Text style={styles.notifTime}>
                      {new Date(notif.createdAt || new Date()).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <TouchableOpacity onPress={() => router.back()} style={styles.cta}>
          <Text style={styles.ctaText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 20, fontWeight: "700" },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  sectionDescription: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
  message: { borderRadius: 8, marginBottom: 16, padding: 12 },
  messageSuccess: { backgroundColor: "rgba(0, 200, 83, 0.1)", borderColor: COLORS.accent, borderWidth: 1 },
  messageError: { backgroundColor: "rgba(176, 0, 32, 0.1)", borderColor: "#B00020", borderWidth: 1 },
  messageText: { color: COLORS.text, fontWeight: "600" },
  notificationOption: { alignItems: "center", backgroundColor: COLORS.card, borderRadius: 12, flexDirection: "row", gap: 12, marginBottom: 12, padding: 12 },
  optionContent: { flex: 1 },
  optionTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  optionDescription: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  notificationCard: { backgroundColor: COLORS.card, borderRadius: 8, marginBottom: 8, padding: 12 },
  notifTitle: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  notifBody: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  notifTime: { color: COLORS.muted, fontSize: 11, marginTop: 6 },
  emptyText: { color: COLORS.muted, fontSize: 13, textAlign: "center", paddingVertical: 20 },
  cta: { alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 8, marginTop: 12, paddingVertical: 12 },
  ctaText: { color: "#fff", fontWeight: "700" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
});
