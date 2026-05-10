import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { getSession } from "../../storage/insecure";
import { getSellerSales, releaseSellerSale } from "../../api/seller";

function money(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function SellerSalesScreen() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState("");
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadSales(nextSellerId) {
    setLoading(true);
    try {
      const response = await getSellerSales({ sellerId: nextSellerId });
      setSales(response.data || []);
    } catch (error) {
      setMessage(error.message || "Unable to load sales history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (!mounted) return;
      const nextSellerId = user?.sellerId || user?.id || "s1";
      setSellerId(nextSellerId);
      loadSales(nextSellerId);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleRelease(orderId) {
    setMessage("");
    try {
      await releaseSellerSale(orderId, { sellerId });
      await loadSales(sellerId);
      setMessage(`Released earnings for ${orderId}.`);
    } catch (error) {
      setMessage(error.message || "Unable to release earnings");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales History</Text>
        <Text style={styles.subtitle}>Commission breakdown and order settlements.</Text>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {loading ? <ActivityIndicator style={{ marginTop: 14 }} /> : null}

      {sales.map((order) => (
        <View key={order.id} style={styles.card}>
          <Text style={styles.name}>{order.id}</Text>
          <Text style={styles.meta}>{new Date(order.createdAt).toLocaleString()}</Text>
          <Text style={styles.meta}>Status: {order.status}</Text>
          <Text style={styles.meta}>Payout: {money(order.settlement?.available || order.settlement?.pending || 0)}</Text>

          {(order.items || []).map((item) => (
            <View key={`${order.id}-${item.productId}`} style={styles.lineItem}>
              <Text style={styles.lineText}>{item.name}</Text>
              <Text style={styles.lineText}>{money(item.lineTotal)}</Text>
              <Text style={styles.smallText}>Commission {money(item.commissionAmount)} · VAT {money(item.vatAmount)}</Text>
            </View>
          ))}

          {order.settlement?.released ? (
            <Text style={styles.released}>Released to wallet</Text>
          ) : (
            <TouchableOpacity onPress={() => handleRelease(order.id)} style={styles.releaseBtn}>
              <Text style={styles.releaseText}>Mark Delivered / Release Earnings</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {!loading && sales.length === 0 ? <Text style={styles.empty}>No sales yet.</Text> : null}

      <TouchableOpacity onPress={() => router.push("/seller/wallet")} style={styles.secondaryCta}>
        <Text style={styles.secondaryCtaText}>Open Earnings Wallet</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingBottom: 30, paddingTop: 54 },
  header: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
  },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.85)", marginTop: 6 },
  message: { color: COLORS.primary, marginTop: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  name: { color: COLORS.text, fontWeight: "700", fontSize: 16 },
  meta: { color: COLORS.muted, marginTop: 4 },
  lineItem: {
    borderTopColor: COLORS.borderGray,
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 10,
  },
  lineText: { color: COLORS.text, fontWeight: "600" },
  smallText: { color: COLORS.muted, marginTop: 4, fontSize: 12 },
  released: { color: "#0B7A4B", fontWeight: "700", marginTop: 10 },
  releaseBtn: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 10,
    paddingVertical: 10,
  },
  releaseText: { color: "#fff", fontWeight: "700" },
  empty: { color: COLORS.muted, marginTop: 16 },
  secondaryCta: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 12,
  },
  secondaryCtaText: { color: COLORS.primary, fontWeight: "700" },
});
