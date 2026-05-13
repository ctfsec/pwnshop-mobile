import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { getSession } from "../../storage/insecure";
import { CONFIG } from "../../api/config";

function money(v) { return `₦${Number(v || 0).toLocaleString()}`; }

const STATUS_META = {
  pending:    { color: "#B07800", bg: "#FFF8E7", icon: "time-outline",              label: "Pending" },
  processing: { color: "#1737AA", bg: "#EEF2FF", icon: "refresh-outline",           label: "Processing" },
  shipped:    { color: "#0B7A4B", bg: "#F0FBF5", icon: "car-outline",               label: "Shipped" },
  delivered:  { color: "#0B7A4B", bg: "#F0FBF5", icon: "checkmark-circle-outline",  label: "Delivered" },
  cancelled:  { color: "#B00020", bg: "#FFF5F5", icon: "close-circle-outline",      label: "Cancelled" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { color: COLORS.muted, bg: COLORS.card, icon: "ellipse-outline", label: status };
  return (
    <View style={[s.badge, { backgroundColor: meta.bg }]}>
      <Ionicons name={meta.icon} size={13} color={meta.color} />
      <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export default function PendingItemsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 25 : 0;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      async function load() {
        setLoading(true);
        const { user } = await getSession();
        if (!mounted) return;
        if (!user) { setLoading(false); return; }
        setUserId(user.id);
        try {
          const res = await fetch(`${CONFIG.BASE_URL}/api/orders?userId=${user.id}`);
          const json = await res.json();
          if (!mounted) return;
          const active = (json.data || []).filter((o) =>
            ["pending", "processing", "shipped"].includes(String(o.status || "").toLowerCase())
          );
          setOrders(active);
        } catch {}
        finally { if (mounted) setLoading(false); }
      }
      load();
      return () => { mounted = false; };
    }, [])
  );

  return (
    <View style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={s.title}>Pending Items</Text>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : !userId ? (
        <View style={s.center}>
          <Ionicons name="lock-closed-outline" size={48} color={COLORS.muted} />
          <Text style={s.emptyTitle}>Login to see pending items</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={s.actionBtn}>
            <Text style={s.actionBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="checkmark-done-circle-outline" size={52} color={COLORS.muted} />
          <Text style={s.emptyTitle}>No pending orders</Text>
          <Text style={s.emptySub}>Your active orders (pending, processing, shipped) will appear here.</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)")} style={s.actionBtn}>
            <Text style={s.actionBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.count}>{orders.length} active order{orders.length !== 1 ? "s" : ""}</Text>
          {orders.map((order) => (
            <View key={order.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.orderId}>{order.id}</Text>
                  <Text style={s.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                </View>
                <StatusBadge status={order.status} />
              </View>

              {(order.items || []).map((item, i) => (
                <View key={`${order.id}-${i}`} style={s.itemRow}>
                  <Ionicons name="cube-outline" size={14} color={COLORS.muted} />
                  <Text style={s.itemName}>{item.name || item.productId}</Text>
                  <Text style={s.itemQty}>×{item.qty}</Text>
                </View>
              ))}

              <View style={s.cardBottom}>
                <Text style={s.totalLabel}>Order total</Text>
                <Text style={s.totalValue}>{money(order.totalNaira)}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: bottomPadding }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
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
  center: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginTop: 14 },
  emptySub: { color: COLORS.muted, fontSize: 13, lineHeight: 18, marginTop: 6, textAlign: "center" },
  actionBtn: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 10, marginTop: 16, paddingHorizontal: 32, paddingVertical: 12 },
  actionBtnText: { color: "#fff", fontWeight: "700" },
  body: { padding: 16, paddingBottom: 32 },
  count: { color: COLORS.muted, fontSize: 13, marginBottom: 10 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 14 },
  cardTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  orderId: { color: COLORS.text, fontFamily: "Syne_700Bold", fontWeight: "700", fontSize: 13 },
  orderDate: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  badge: { alignItems: "center", borderRadius: 8, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  itemRow: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 4 },
  itemName: { color: COLORS.text, flex: 1, fontSize: 13 },
  itemQty: { color: COLORS.muted, fontSize: 12 },
  cardBottom: { alignItems: "center", borderTopColor: COLORS.borderGray, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 10 },
  totalLabel: { color: COLORS.muted, fontSize: 13 },
  totalValue: { color: COLORS.primary, fontFamily: "Syne_700Bold", fontSize: 16, fontWeight: "700" },
});
