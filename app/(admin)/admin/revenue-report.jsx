import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { getAdminRevenueReport } from "../../../api/admin";

function money(v) { return `₦${Number(v || 0).toLocaleString()}`; }

function BreakdownRow({ icon, iconColor, label, value }) {
  return (
    <View style={styles.breakRow}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "22" }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.breakLabel}>{label}</Text>
      <Text style={[styles.breakValue, { color: iconColor }]}>{money(value)}</Text>
    </View>
  );
}

export default function AdminRevenueReportScreen() {
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 20 : 0;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAdminRevenueReport()
      .then((res) => setReport(res.data || null))
      .catch((e) => setMessage(e.message || "Unable to load revenue report"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  const bd = report?.breakdown || {};
  const summary = report?.summary || {};

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 30 + bottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Revenue Report</Text>
        <Text style={styles.subtitle}>Full platform earnings breakdown.</Text>
      </View>

      {message ? <Text style={styles.error}>{message}</Text> : null}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Platform Revenue</Text>
        <Text style={styles.totalValue}>{money(bd.total)}</Text>
        <View style={styles.statRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{summary.orderCount || 0}</Text><Text style={styles.statLabel}>Orders</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{summary.completedOrders || 0}</Text><Text style={styles.statLabel}>Completed</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{summary.userCount || 0}</Text><Text style={styles.statLabel}>Users</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{summary.sellerCount || 0}</Text><Text style={styles.statLabel}>Sellers</Text></View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
      <View style={styles.card}>
        <BreakdownRow icon="car-outline" iconColor="#1737AA" label="Logistics Revenue" value={bd.logisticsRevenue} />
        <BreakdownRow icon="trending-up" iconColor="#0B7A4B" label="Commission Revenue" value={bd.commissionRevenue} />
        <BreakdownRow icon="receipt-outline" iconColor="#B07800" label="VAT Collected (7.5%)" value={bd.vatCollected} />
        <BreakdownRow icon="cash-outline" iconColor="#8B2FC9" label="Withdrawal Fees (₦100 each)" value={bd.withdrawalFees} />
        <View style={styles.divider} />
        <BreakdownRow icon="bar-chart" iconColor={COLORS.primary} label="Total" value={bd.total} />
      </View>

      {(report?.byCategory || []).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Commission by Category</Text>
          <View style={styles.card}>
            {(report.byCategory || []).map((cat, i) => (
              <View key={cat.category} style={[styles.catRow, i < report.byCategory.length - 1 && styles.catBorder]}>
                <Text style={styles.catName}>{cat.category}</Text>
                <View style={styles.catRight}>
                  <Text style={styles.catCommission}>{money(cat.commission)}</Text>
                  <Text style={styles.catSales}>on {money(cat.grossSales)}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {(report?.byDay || []).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Daily Revenue</Text>
          {(report.byDay || []).map((item) => (
            <View key={item.day} style={styles.dayCard}>
              <Text style={styles.dayDate}>{item.day}</Text>
              <Text style={styles.dayRevenue}>{money(item.grossRevenue)}</Text>
              <Text style={styles.dayMeta}>{item.orderCount} orders · Commission {money(item.commission)} · Logistics {money(item.logistics)}</Text>
            </View>
          ))}
        </>
      )}

      {(report?.byPaymentMethod || []).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>By Payment Method</Text>
          <View style={styles.card}>
            {(report.byPaymentMethod || []).map((item) => (
              <View key={item.paymentMethod} style={styles.payRow}>
                <Text style={styles.payMethod}>{item.paymentMethod || "unknown"}</Text>
                <Text style={styles.payAmount}>{money(item.amount)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16,  paddingTop: 54 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 5 },
  error: { color: "#B00020", marginTop: 10 },
  totalCard: { alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 14, marginTop: 16, padding: 20 },
  totalLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  totalValue: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 32, fontWeight: "700", marginTop: 4 },
  statRow: { flexDirection: "row", gap: 20, marginTop: 14 },
  stat: { alignItems: "center" },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  statLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  sectionTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 16, marginBottom: 8, marginTop: 18 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 12, borderWidth: 1, padding: 14 },
  breakRow: { alignItems: "center", flexDirection: "row", paddingVertical: 8 },
  iconWrap: { alignItems: "center", borderRadius: 8, height: 34, justifyContent: "center", marginRight: 10, width: 34 },
  breakLabel: { color: COLORS.text, flex: 1, fontSize: 14 },
  breakValue: { fontWeight: "700", fontSize: 14 },
  divider: { borderTopColor: COLORS.borderGray, borderTopWidth: 1, marginVertical: 4 },
  catRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  catBorder: { borderBottomColor: COLORS.borderGray, borderBottomWidth: 1 },
  catName: { color: COLORS.text, flex: 1, fontSize: 13 },
  catRight: { alignItems: "flex-end" },
  catCommission: { color: "#0B7A4B", fontWeight: "700", fontSize: 14 },
  catSales: { color: COLORS.muted, fontSize: 11 },
  dayCard: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginBottom: 8, padding: 12 },
  dayDate: { color: COLORS.muted, fontSize: 12 },
  dayRevenue: { color: COLORS.primary, fontFamily: "Syne_700Bold", fontSize: 18, fontWeight: "700" },
  dayMeta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  payRow: { alignItems: "center", borderBottomColor: COLORS.borderGray, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  payMethod: { color: COLORS.text, fontSize: 14, textTransform: "capitalize" },
  payAmount: { color: COLORS.primary, fontWeight: "700" },
});
