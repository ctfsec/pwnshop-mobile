import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { getSession } from "../../storage/insecure";
import { getSellerDashboard, releaseSellerSale } from "../../api/seller";

function money(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function SellerTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 5 : 0;
  const [user, setUser] = useState(null);
  const [sellerId, setSellerId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDashboard(nextSellerId) {
    setLoading(true);
    try {
      const response = await getSellerDashboard({ sellerId: nextSellerId });
      setDashboard(response.data || null);
    } catch (error) {
      setMessage(error.message || "Unable to load seller dashboard");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getSession().then(({ user: storedUser }) => {
        if (!mounted || !storedUser) return;
        const nextSellerId = storedUser.sellerId || storedUser.id;
        setUser(storedUser);
        setSellerId(nextSellerId);
        loadDashboard(nextSellerId);
      });
      return () => { mounted = false; };
    }, [])
  );

  async function handleRelease(orderId) {
    setMessage("");
    try {
      await releaseSellerSale(orderId, { sellerId });
      await loadDashboard(sellerId);
      setMessage(`Order ${orderId} released to available balance.`);
    } catch (error) {
      setMessage(error.message || "Unable to release order settlement");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Seller Dashboard</Text>
          <Text style={styles.subtitle}>Manage earnings, products, and sales from one place.</Text>
        </View>
        <TouchableOpacity onPress={() => sellerId && loadDashboard(sellerId)} style={styles.refreshBtn} disabled={loading}>
          <Ionicons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => router.push("/seller/products")} style={styles.actionBtn}>
          <Text style={styles.actionText}>My Products</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/seller/product/new")} style={styles.actionBtnPrimary}>
          <Text style={styles.actionTextPrimary}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => router.push("/seller/sales")} style={styles.actionBtn}>
          <Text style={styles.actionText}>Sales History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/seller/wallet")} style={styles.actionBtn}>
          <Text style={styles.actionText}>Earnings Wallet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => router.push("/seller/analytics")} style={styles.actionBtn}>
          <Text style={styles.actionText}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/seller/profile")} style={styles.actionBtn}>
          <Text style={styles.actionText}>Store Profile</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.summaryGrid}>
        <SummaryCard label="Available" value={money(dashboard?.wallet?.available)} />
        <SummaryCard label="Pending" value={money(dashboard?.wallet?.pending)} />
        <SummaryCard label="Products" value={String(dashboard?.productCount || 0)} />
        <SummaryCard label="Orders" value={String(dashboard?.totalOrders || 0)} />
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Wallet Breakdown</Text>
        {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : (
          <View style={styles.breakdownGrid}>
            <BreakdownItem icon="trending-up" iconColor="#0B7A4B" label="Gross Sales" value={money(dashboard?.wallet?.grossSales)} valueColor="#0B7A4B" />
            <BreakdownItem icon="cash-outline" iconColor={COLORS.primary} label="Commission Revenue" value={money(dashboard?.wallet?.commissionRevenue)} valueColor={COLORS.primary} />
            <BreakdownItem icon="receipt-outline" iconColor="#B07800" label="VAT Collected" value={money(dashboard?.wallet?.vatCollected)} valueColor="#B07800" />
            <BreakdownItem icon="remove-circle-outline" iconColor="#B00020" label="Withdrawal Fees" value={money(dashboard?.wallet?.withdrawalFees)} valueColor="#B00020" />
          </View>
        )}
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}
        {(dashboard?.recentOrders || []).length === 0 ? <Text style={styles.empty}>No sales yet.</Text> : null}
        {(dashboard?.recentOrders || []).map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <Text style={styles.orderTitle}>{order.id}</Text>
            <Text style={styles.orderMeta}>{new Date(order.createdAt).toLocaleString()}</Text>
            <Text style={styles.orderMeta}>Payout: {money(order.payout)}</Text>
            <Text style={styles.orderMeta}>Commission: {money(order.commissionRevenue)} | VAT: {money(order.vatCollected)}</Text>
            {order.settlement?.released ? (
              <Text style={styles.released}>Released</Text>
            ) : (
              <TouchableOpacity onPress={() => handleRelease(order.id)} style={styles.releaseBtn}>
                <Text style={styles.releaseText}>Release Pending Earnings</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Top Products</Text>
        {(dashboard?.topProducts || []).map((product) => (
          <View key={product.id} style={styles.productRow}>
            <View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>{product.category}</Text>
            </View>
            <Text style={styles.productMeta}>Stock {product.stock}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={() => router.push("/category/browse-all")} style={styles.secondaryCta}>
        <Text style={styles.secondaryCtaText}>Go To Storefront</Text>
      </TouchableOpacity>
      <View style={{ height: bottomPadding }} />
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

function BreakdownItem({ icon, iconColor, label, value, valueColor }) {
  return (
    <View style={styles.breakdownRow}>
      <View style={[styles.breakdownIconWrap, { backgroundColor: iconColor + "18" }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 30,
    paddingTop: 54,
  },
  header: {
    alignItems: "flex-start",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: "row",
    padding: 18,
  },
  refreshBtn: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
    marginTop: 4,
    width: 36,
  },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.85)", marginTop: 6, lineHeight: 18 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
    minHeight: 50,
  },
  actionBtnPrimary: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 14,
    minHeight: 50,
  },
  actionText: { color: COLORS.primary, fontWeight: "700", fontSize: 13, textAlign: "center" },
  actionTextPrimary: { color: "#fff", fontWeight: "700", fontSize: 13, textAlign: "center" },
  message: { color: COLORS.primary, marginTop: 12, fontWeight: "600" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    width: "48%",
    minHeight: 100,
    justifyContent: "center",
  },
  summaryLabel: { color: COLORS.muted, fontSize: 12 },
  summaryValue: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 20, marginTop: 6 },
  breakdownCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  sectionTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 18 },
  breakdownGrid: { marginTop: 12, gap: 8 },
  breakdownRow: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 10,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  breakdownIconWrap: {
    alignItems: "center",
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  breakdownLabel: { color: COLORS.text, flex: 1, fontSize: 13, fontWeight: "600" },
  breakdownValue: { fontSize: 14, fontWeight: "700" },
  orderCard: {
    borderTopColor: COLORS.borderGray,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  orderTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  orderMeta: { color: COLORS.muted, marginTop: 4, fontSize: 12 },
  released: { color: "#0B7A4B", fontWeight: "700", marginTop: 8, fontSize: 13 },
  releaseBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 10,
    minHeight: 44,
  },
  releaseText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  productRow: {
    alignItems: "center",
    borderTopColor: COLORS.borderGray,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
  },
  productName: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  productMeta: { color: COLORS.muted, marginTop: 4, fontSize: 12 },
  empty: { color: COLORS.muted, marginTop: 12, fontSize: 13 },
  secondaryCta: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  secondaryCtaText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
});
