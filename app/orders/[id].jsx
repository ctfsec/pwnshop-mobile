import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { getOrderById } from "../../api/orders";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await getOrderById(id || "o1");
        if (mounted) {
          setOrder(response.data || null);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError.message || "Unable to load order");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const totalNaira = Number(order?.totalNaira || 0);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Order Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} /> : null}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
            <Text style={styles.errorSub}>Order ID: {id}</Text>
            <TouchableOpacity onPress={() => router.replace("/orders")} style={[styles.cta, { marginTop: 12 }]}>
              <Text style={styles.ctaText}>View All Orders</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && order ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Order {order.id}</Text>
              <Text style={styles.cardMeta}>Status: {order.status}</Text>
              <Text style={styles.cardMeta}>Created: {formatDate(order.createdAt)}</Text>
              <Text style={styles.cardMeta}>Payment: {order.paymentMethod}</Text>
              <Text style={styles.cardMeta}>Shipping: {order.shippingAddress || "Not provided"}</Text>
              <Text style={styles.total}>Total: ₦{totalNaira.toLocaleString()}</Text>
            </View>

            <Text style={styles.sectionTitle}>Items</Text>
            {order.items?.map((item) => (
              <View key={`${order.id}-${item.productId}`} style={styles.itemCard}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>Qty: {item.qty}</Text>
                <Text style={styles.itemMeta}>Unit Price: ₦{Number(item.priceNaira || 0).toLocaleString()}</Text>
              </View>
            ))}
          </>
        ) : null}

        {!loading && !error && !order ? <Text style={styles.empty}>No order found.</Text> : null}

        <TouchableOpacity onPress={() => router.push("/orders")} style={styles.cta}>
          <Text style={styles.ctaText}>Back to Orders</Text>
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
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700" },
  body: { padding: 16, paddingBottom: 30 },
  errorBox: { marginTop: 16, padding: 16, backgroundColor: "#FFF5F5", borderRadius: 8, borderWidth: 1, borderColor: "#B00020" },
  error: { color: "#B00020", fontWeight: "700" },
  errorSub: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  empty: { color: COLORS.muted, marginTop: 10 },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  cardMeta: { color: COLORS.muted, marginTop: 6 },
  total: { color: COLORS.primary, fontSize: 18, fontWeight: "700", marginTop: 10 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontFamily: "Syne_700Bold", fontWeight: "700", marginTop: 18, marginBottom: 8 },
  itemCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  itemName: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  itemMeta: { color: COLORS.muted, marginTop: 6 },
  cta: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  ctaText: { color: "#fff", fontWeight: "700" },
});
