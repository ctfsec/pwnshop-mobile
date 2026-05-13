import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../constants/colors";
import { getAdminDashboard, resetAdminLab } from "../../../api/admin";

const NAV_ITEMS = [
  { label: "User Management", route: "/admin/users", icon: "people-outline" },
  { label: "Order Management", route: "/admin/orders", icon: "receipt-outline" },
  { label: "Product Management", route: "/admin/products", icon: "cube-outline" },
  { label: "Seller Management", route: "/admin/sellers", icon: "storefront-outline" },
  { label: "Coupon Management", route: "/admin/coupons", icon: "pricetag-outline" },
  { label: "Revenue Report", route: "/admin/revenue-report", icon: "bar-chart-outline" },
  { label: "Notifications", route: "/admin/notifications", icon: "notifications-outline" },
  { label: "Security Logs", route: "/admin/security-logs", icon: "shield-outline" },
  { label: "Activity Logs", route: "/admin/activity-logs", icon: "list-outline" },
  { label: "Chat Logs", route: "/admin/chat-logs", icon: "chatbubbles-outline" },
  { label: "VulnBank Logs", route: "/admin/vulnbank-logs", icon: "card-outline" },
];

function money(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 20 : 0;
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyReset, setBusyReset] = useState(false);
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    setLoading(true);
    try {
      const response = await getAdminDashboard();
      setDashboard(response.data || null);
    } catch (error) {
      setMessage(error.message || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleResetLab() {
    setBusyReset(true);
    setMessage("");
    try {
      const response = await resetAdminLab({ source: "admin_ui" });
      setMessage(`Lab reset completed. Previous orders: ${response.data?.previousOrders || 0}`);
      await loadDashboard();
    } catch (error) {
      setMessage(error.message || "Unable to reset lab");
    } finally {
      setBusyReset(false);
    }
  }

  const stats = dashboard?.stats || {};

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 30 + bottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Revenue, platform stats, and lab controls.</Text>
      </View>

      <View style={styles.grid}>
        <SummaryCard label="Gross Revenue" value={money(stats.grossRevenue)} />
        <SummaryCard label="Orders" value={String(stats.orderCount || 0)} />
        <SummaryCard label="Users" value={String(stats.userCount || 0)} />
        <SummaryCard label="Products" value={String(stats.productCount || 0)} />
      </View>

      <TouchableOpacity disabled={busyReset} onPress={handleResetLab} style={styles.resetBtn}>
        {busyReset ? <ActivityIndicator color="#fff" /> : <Text style={styles.resetText}>Reset Lab State</Text>}
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Text style={styles.sectionTitle}>Admin Modules</Text>
      <View style={styles.navList}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity key={item.route} onPress={() => router.push(item.route)} style={styles.navItem}>
            <Ionicons name={item.icon} size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={styles.navText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
    </ScrollView>
  );
}

function SummaryCard({ label, value }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingTop: 54 },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    width: "48%",
  },
  summaryLabel: { color: COLORS.muted, fontSize: 12 },
  summaryValue: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 18, marginTop: 5 },
  resetBtn: {
    alignItems: "center",
    backgroundColor: "#B00020",
    borderRadius: 8,
    marginTop: 14,
    paddingVertical: 12,
  },
  resetText: { color: "#fff", fontWeight: "700" },
  message: { color: COLORS.primary, marginTop: 10 },
  sectionTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 18, marginTop: 16 },
  navList: { marginTop: 10 },

  navItem: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  navText: { color: COLORS.text, flex: 1, fontWeight: "700" },
});
