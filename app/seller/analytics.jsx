import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { getSession } from "../../storage/insecure";
import { getSellerAnalytics } from "../../api/seller";

function money(v) { return `₦${Number(v || 0).toLocaleString()}`; }

function StatCard({ icon, iconColor, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + "20" }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function SellerAnalyticsScreen() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (!mounted) return;
      const sellerId = user?.sellerId || user?.id;
      getSellerAnalytics({ sellerId })
        .then((res) => { if (mounted) setAnalytics(res.data || null); })
        .catch((e) => { if (mounted) setMessage(e.message || "Unable to load analytics"); })
        .finally(() => { if (mounted) setLoading(false); });
    });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Seller Analytics</Text>
        <Text style={styles.subtitle}>Revenue trends and top products.</Text>
      </View>

      {message ? <Text style={styles.error}>{message}</Text> : null}

      <View style={styles.statGrid}>
        <StatCard icon="cash-outline" iconColor="#0B7A4B" label="Total Revenue" value={money(analytics?.totalRevenue)} />
        <StatCard icon="receipt-outline" iconColor="#1737AA" label="Total Orders" value={String(analytics?.totalOrders || 0)} />
        <StatCard icon="cube-outline" iconColor="#B07800" label="Products" value={String(analytics?.totalProducts || 0)} />
      </View>

      {(analytics?.topProducts || []).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Products by Revenue</Text>
          <View style={styles.card}>
            {(analytics.topProducts || []).map((p, i) => (
              <View key={p.productId} style={[styles.productRow, i < analytics.topProducts.length - 1 && styles.productBorder]}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productMeta}>{p.unitsSold} units sold</Text>
                </View>
                <Text style={styles.productRevenue}>{money(p.revenue)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {(analytics?.byDay || []).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Daily Revenue</Text>
          {(analytics.byDay || []).map((day) => {
            const maxRevenue = Math.max(...analytics.byDay.map((d) => d.revenue), 1);
            const barWidth = `${Math.round((day.revenue / maxRevenue) * 100)}%`;
            return (
              <View key={day.day} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{day.day}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { width: barWidth }]} />
                </View>
                <Text style={styles.dayRevenue}>{money(day.revenue)}</Text>
              </View>
            );
          })}
        </>
      )}

      {(analytics?.byDay || []).length === 0 && !loading && (
        <View style={styles.empty}>
          <Ionicons name="bar-chart-outline" size={48} color={COLORS.muted} />
          <Text style={styles.emptyText}>No sales data yet.</Text>
          <Text style={styles.emptyMeta}>Revenue charts will appear here once you have completed orders.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingBottom: 40, paddingTop: 54 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 5 },
  error: { color: "#B00020", marginTop: 10 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  statCard: { alignItems: "center", backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 12, borderWidth: 1, flex: 1, minWidth: "28%", padding: 14 },
  statIcon: { alignItems: "center", borderRadius: 10, height: 44, justifyContent: "center", marginBottom: 8, width: 44 },
  statValue: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 18, fontWeight: "700" },
  statLabel: { color: COLORS.muted, fontSize: 11, marginTop: 2, textAlign: "center" },
  sectionTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 16, marginBottom: 8, marginTop: 20 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 12, borderWidth: 1, padding: 14 },
  productRow: { alignItems: "center", flexDirection: "row", gap: 10, paddingVertical: 10 },
  productBorder: { borderBottomColor: COLORS.borderGray, borderBottomWidth: 1 },
  rankBadge: { alignItems: "center", backgroundColor: COLORS.primary + "18", borderRadius: 8, height: 32, justifyContent: "center", width: 32 },
  rankText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  productName: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  productMeta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  productRevenue: { color: "#0B7A4B", fontWeight: "700", fontSize: 14 },
  dayRow: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 8 },
  dayLabel: { color: COLORS.muted, fontSize: 11, width: 80 },
  barContainer: { backgroundColor: COLORS.borderGray, borderRadius: 4, flex: 1, height: 8 },
  bar: { backgroundColor: COLORS.primary, borderRadius: 4, height: 8 },
  dayRevenue: { color: COLORS.text, fontWeight: "700", fontSize: 12, width: 80, textAlign: "right" },
  empty: { alignItems: "center", marginTop: 50, paddingHorizontal: 30 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyMeta: { color: COLORS.muted, fontSize: 13, marginTop: 6, textAlign: "center", lineHeight: 18 },
});
