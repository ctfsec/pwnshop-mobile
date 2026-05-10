import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../constants/colors";
import { getAdminOrders, updateAdminOrderStatus } from "../../../api/admin";

const STATUSES = ["pending", "processing", "completed", "cancelled"];

function money(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    const response = await getAdminOrders();
    setOrders(response.data || []);
  }

  useEffect(() => {
    loadOrders().catch((error) => setMessage(error.message || "Unable to load orders"));
  }, []);

  async function cycleStatus(order) {
    setMessage("");
    const currentIndex = STATUSES.indexOf(order.status);
    const nextStatus = STATUSES[(currentIndex + 1) % STATUSES.length];
    try {
      await updateAdminOrderStatus(order.id, { status: nextStatus });
      await loadOrders();
      setMessage(`${order.id} moved to ${nextStatus}`);
    } catch (error) {
      setMessage(error.message || "Unable to update order status");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        <Text style={styles.subtitle}>Review and update order status controls.</Text>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {orders.map((order) => (
        <View key={order.id} style={styles.card}>
          <Text style={styles.name}>{order.id}</Text>
          <Text style={styles.meta}>User: {order.userId}</Text>
          <Text style={styles.meta}>Total: {money(order.totalNaira)}</Text>
          <Text style={styles.meta}>Status: {order.status}</Text>
          <TouchableOpacity onPress={() => cycleStatus(order)} style={styles.btn}>
            <Text style={styles.btnText}>Cycle Status</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingBottom: 30, paddingTop: 54 },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 5 },
  message: { color: COLORS.primary, marginTop: 10 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 12 },
  name: { color: COLORS.text, fontWeight: "700" },
  meta: { color: COLORS.muted, marginTop: 4 },
  btn: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 10, paddingVertical: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
});
