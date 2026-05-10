import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { getOrders } from "../../api/orders";
import { getSession } from "../../storage/insecure";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const { user } = await getSession();
        const response = await getOrders(user?.id || "u1");

        if (mounted) {
          setOrders(response.data || []);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError.message || "Unable to load orders");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
      </View>

      <View style={styles.body}>
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && orders.length === 0 ? (
          <Text style={styles.empty}>No orders yet.</Text>
        ) : null}

        {orders.map((order) => (
          <TouchableOpacity key={order.id} onPress={() => router.push(`/orders/${order.id}`)} activeOpacity={0.7}>
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Order {order.id}</Text>
                <Text style={styles.cardMeta}>Status: {order.status}</Text>
                <Text style={styles.cardMeta}>Total: ₦{Number(order.totalNaira || 0).toLocaleString()}</Text>
                <Text style={styles.cardMeta}>Created: {formatDate(order.createdAt)}</Text>
                <Text style={styles.cardMeta}>Items: {order.items?.length || 0}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push(`/tracking/${order.id}`)} style={styles.trackBtn} activeOpacity={0.8}>
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.trackBtnText}>Track</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.cta}>
          <Text style={styles.ctaText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
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
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700" },
  body: { padding: 16 },
  empty: { color: COLORS.muted, marginTop: 10 },
  error: { color: "#B00020", marginTop: 10 },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardContent: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  cardMeta: { color: COLORS.muted, marginTop: 5 },
  trackBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 60,
  },
  trackBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  cta: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  ctaText: { color: "#fff", fontWeight: "700" },
});
