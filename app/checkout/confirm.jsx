import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { COLORS } from "../../constants/colors";
import { getSession } from "../../storage/insecure";

export default function OrderConfirmScreen() {
  const router = useRouter();
  const { orderId, total, storePickup, storeName, storeAddress } = useLocalSearchParams();
  const isPickup = storePickup === "1";
  const decodedStoreName = storeName ? decodeURIComponent(storeName) : "";
  const decodedStoreAddress = storeAddress ? decodeURIComponent(storeAddress) : "";

  // PWN-M012: silently copies session token + order details to clipboard on mount
  // Any app with clipboard access (keyboards, password managers) can read this
  useEffect(() => {
    async function silentClipboardLeak() {
      try {
        const { user, token } = await getSession();
        const leaked = [
          `order_id=${orderId}`,
          `amount=NGN${total}`,
          `email=${user?.email || ""}`,
          `session_token=${token || ""}`,
        ].join("&");
        await Clipboard.setStringAsync(leaked);
      } catch (_) {}
    }
    silentClipboardLeak();
  }, []);

  return (
    <View style={styles.page}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={90} color="#0B7A4B" />
        </View>

        <Text style={styles.heading}>Order Placed!</Text>
        <Text style={styles.sub}>
          Thank you for shopping with Pwnshop. Your order has been received and is being processed.
        </Text>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{orderId}</Text>
          </View>
          {total ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Charged</Text>
              <Text style={[styles.detailValue, { color: COLORS.primary }]}>
                ₦{Number(total).toLocaleString()}
              </Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fulfillment</Text>
            <Text style={styles.detailValue}>
              {isPickup ? "Store Pickup" : "Home Delivery"}
            </Text>
          </View>
        </View>

        {isPickup ? (
          <View style={styles.infoBox}>
            <Ionicons name="storefront-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Your order will be ready for pickup within 24–48 hours at{decodedStoreName ? ` ${decodedStoreName}` : " your selected store"}{decodedStoreAddress ? ` — ${decodedStoreAddress}` : ""}. Bring a valid ID and your order ID when you visit.
            </Text>
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Ionicons name="bicycle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Your order is on its way. Estimated delivery is 2–5 business days depending on your location.
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push(`/orders/${orderId}`)}
          style={styles.primaryBtn}
        >
          <Ionicons name="receipt-outline" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>View Order Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/orders/track")}
          style={styles.secondaryBtn}
        >
          <Ionicons name="time-outline" size={16} color={COLORS.primary} />
          <Text style={styles.secondaryBtnText}>Track This Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1, justifyContent: "center" },
  body: { alignItems: "center", padding: 24 },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "#F0FBF5",
    borderRadius: 60,
    height: 120,
    justifyContent: "center",
    marginBottom: 24,
    width: 120,
  },
  heading: {
    color: COLORS.text,
    fontFamily: "Syne_700Bold",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
  },
  sub: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  detailCard: {
    alignSelf: "stretch",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  detailLabel: { color: COLORS.muted, fontSize: 13 },
  detailValue: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  infoBox: {
    alignItems: "flex-start",
    alignSelf: "stretch",
    backgroundColor: COLORS.primary + "10",
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
    padding: 14,
  },
  infoText: { color: COLORS.text, flex: 1, fontSize: 13, lineHeight: 19 },
  primaryBtn: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 10,
    paddingVertical: 14,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 10,
    paddingVertical: 14,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
  linkBtn: { marginTop: 6 },
  linkText: { color: COLORS.muted, fontWeight: "600", textAlign: "center" },
});
