import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { getOrders } from "../../api/orders";
import { getSession } from "../../storage/insecure";

function getEtaFromStatus(status) {
  const normalized = String(status || "").toLowerCase();
  const map = {
    pending: "4 days",
    processing: "3 days",
    in_transit: "2 days",
    out_for_delivery: "Today",
    completed: "Delivered",
  };

  return map[normalized] || "TBD";
}

function getOrderPrimaryItem(order) {
  if (!Array.isArray(order?.items) || order.items.length === 0) {
    return "Order items";
  }

  return String(order.items[0]?.name || "Order items");
}

export default function TrackOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const { user } = await getSession();
        const response = await getOrders(user?.id || "u1");

        if (mounted) {
          setOrders(response?.data || []);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError.message || "Unable to load trackable orders");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Track Orders</Text>
      </View>

      <View style={styles.body}>
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && orders.length === 0 ? (
          <Text style={styles.empty}>No orders to track yet.</Text>
        ) : null}

        {orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            onPress={() => router.push(`/tracking/${order.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.item}>{getOrderPrimaryItem(order)}</Text>
                <Text style={styles.meta}>Status: {String(order.status || "pending")}</Text>
                <Text style={styles.meta}>ETA: {getEtaFromStatus(order.status)}</Text>
              </View>
              <View style={styles.arrow}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 16 },
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
  error: { color: "#B00020", marginTop: 10 },
  empty: { color: COLORS.muted, marginTop: 10 },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardContent: { flex: 1 },
  orderId: { color: COLORS.primary, fontWeight: "700" },
  item: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginTop: 6 },
  meta: { color: COLORS.muted, marginTop: 4 },
  arrow: { marginLeft: 12, justifyContent: "center" },
});
