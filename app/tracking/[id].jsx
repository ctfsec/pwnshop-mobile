import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { getOrders } from "../../api/orders";
import { getSession } from "../../storage/insecure";

const TRACKING_STATUSES = [
  { id: 1, label: "Order Placed", icon: "checkmark-circle", status: "pending" },
  { id: 2, label: "Payment Confirmed", icon: "checkmark-circle", status: "pending" },
  { id: 3, label: "Processing", icon: "hourglass", status: "processing" },
  { id: 4, label: "Shipped", icon: "airplane", status: "in_transit" },
  { id: 5, label: "Out for Delivery", icon: "bicycle", status: "out_for_delivery" },
  { id: 6, label: "Delivered", icon: "checkmark-done-circle", status: "completed" },
];

export default function TrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [currentStage, setCurrentStage] = React.useState(2);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const { user } = await getSession();
      const orders = await getOrders(user?.id || "u1");
      
      if (mounted) {
        const foundOrder = orders.data?.find((o) => o.id === id);
        if (foundOrder) {
          setOrder(foundOrder);
          // Simulate different stages based on order status
          const stageMap = {
            pending: 2,
            processing: 3,
            in_transit: 4,
            out_for_delivery: 5,
            completed: 6,
          };
          setCurrentStage(stageMap[foundOrder.status] || 2);
        }
        setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [id]);

  if (!order) {
    return (
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons color="#fff" name="arrow-back" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Order Tracking</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: COLORS.muted }}>Order not found</Text>
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
        <Text style={styles.title}>Track Order</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{order.id}</Text>
          <Text style={styles.orderStatus}>{order.status.toUpperCase().replace(/_/g, " ")}</Text>
          <Text style={styles.orderTotal}>₦{Number(order.totalNaira || 0).toLocaleString()}</Text>
        </View>

        <View style={styles.timeline}>
          {TRACKING_STATUSES.map((status, idx) => {
            const isCompleted = idx < currentStage;
            const isCurrent = idx === currentStage - 1;

            return (
              <View key={status.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, isCompleted && styles.dotCompleted, isCurrent && styles.dotCurrent]}>
                    {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  {idx < TRACKING_STATUSES.length - 1 && (
                    <View style={[styles.line, isCompleted && styles.lineCompleted]} />
                  )}
                </View>

                <View style={styles.timelineRight}>
                  <Text style={[styles.statusLabel, (isCompleted || isCurrent) && styles.statusLabelActive]}>
                    {status.label}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.statusTime}>
                      {new Date(order.createdAt).toLocaleString()}
                    </Text>
                  )}
                  {isCompleted && idx < currentStage - 1 && (
                    <Text style={styles.statusTime}>
                      {new Date(order.createdAt).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Delivery Address</Text>
          <Text style={styles.infoText}>{order.shippingAddress || "Pick up from store"}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Items</Text>
          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>×{item.qty}</Text>
              <Text style={styles.itemPrice}>₦{Number(item.priceNaira || 0).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.cta}>
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
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24 },
  orderInfo: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 20 },
  orderNumber: { color: COLORS.muted, fontSize: 12, marginBottom: 4 },
  orderStatus: { color: COLORS.primary, fontWeight: "700", fontSize: 16, marginBottom: 8 },
  orderTotal: { color: COLORS.text, fontWeight: "700", fontSize: 18 },
  timeline: { marginBottom: 24 },
  timelineItem: { flexDirection: "row", marginBottom: 16 },
  timelineLeft: { alignItems: "center", marginRight: 16, position: "relative", width: 40 },
  dot: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 12, borderWidth: 2, height: 24, width: 24, alignItems: "center", justifyContent: "center" },
  dotCompleted: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dotCurrent: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  line: { backgroundColor: COLORS.borderGray, height: 40, width: 2, position: "absolute", top: 24 },
  lineCompleted: { backgroundColor: COLORS.primary },
  timelineRight: { flex: 1, paddingTop: 2 },
  statusLabel: { color: COLORS.muted, fontWeight: "600", fontSize: 14 },
  statusLabelActive: { color: COLORS.text, fontWeight: "700" },
  statusTime: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  infoCard: { backgroundColor: COLORS.card, borderRadius: 12, borderColor: COLORS.borderGray, borderWidth: 1, padding: 16, marginBottom: 12 },
  infoTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14, marginBottom: 8 },
  infoText: { color: COLORS.muted, lineHeight: 20 },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottomColor: COLORS.borderGray, borderBottomWidth: 1 },
  itemName: { flex: 1, color: COLORS.text, fontWeight: "600", fontSize: 13 },
  itemQty: { color: COLORS.muted, fontSize: 12, marginHorizontal: 8 },
  itemPrice: { color: COLORS.primary, fontWeight: "700", fontSize: 13, minWidth: 100, textAlign: "right" },
  cta: { alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 8, marginTop: 16, paddingVertical: 12 },
  ctaText: { color: "#fff", fontWeight: "700" },
});
