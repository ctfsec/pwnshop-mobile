import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { useCart } from "../context/CartContext";
import { validateCoupon } from "../../api/coupons";

export default function CartTab() {
  const router = useRouter();
  const { items, removeFromCart, clearCart, applyCoupon, coupon } = useCart();
  const [couponCode, setCouponCode] = useState(coupon?.code || "");
  const [couponMessage, setCouponMessage] = useState("");
  

  function parsePrice(p) {
    if (typeof p === 'number') return p;
    if (!p) return 0;
    try {
      return parseFloat(String(p).replace(/[^0-9.-]+/g, "")) || 0;
    } catch (e) {
      return 0;
    }
  }

  const subtotal = items.reduce((s, it) => s + parsePrice(it.price) * (it.qty || 1), 0);
  const shippingFee = useMemo(() => {
    // Shipping is calculated at checkout; show item-level shipping sums here if present
    return items.reduce((s, it) => s + Number(it.shippingFeeNaira || 0) * (it.qty || 1), 0);
  }, [items]);
  const discountAmount = Number(coupon?.discountAmountNaira || 0);
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  async function handleValidateCoupon() {
    setCouponMessage("");
    try {
      const response = await validateCoupon({
        code: couponCode,
        subtotalNaira: subtotal,
        userId: "u1",
      });
      applyCoupon({
        code: response.data.code,
        discountPercent: response.data.discountPercent,
        discountAmountNaira: response.data.discountAmount,
      });
      setCouponMessage(`Applied ${response.data.code} for ₦${Number(response.data.discountAmount || 0).toLocaleString()}`);
    } catch (error) {
      applyCoupon(null);
      setCouponMessage(error.message || "Invalid coupon");
    }
  }



  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
      </View>

      <View style={styles.list}>
        {items.length === 0 && <Text style={{ color: COLORS.muted }}>Your cart is empty.</Text>}
        {items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text numberOfLines={1} style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>Qty: {item.qty}</Text>
            <Text style={styles.itemPrice}>{item.price}</Text>
            <Text style={styles.itemMeta}>Shipping: ₦{Number(item.shippingFeeNaira || 0).toLocaleString()}</Text>
            <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ marginTop: 8 }}>
              <Text style={{ color: COLORS.primary }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.cardBlock}>
        <Text style={styles.sectionTitle}>Coupon</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter coupon code"
          value={couponCode}
          onChangeText={setCouponCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity onPress={handleValidateCoupon} style={styles.smallBtn}>
          <Text style={styles.smallBtnText}>Apply Coupon</Text>
        </TouchableOpacity>
        {couponMessage ? <Text style={styles.couponMessage}>{couponMessage}</Text> : null}
      </View>

      {/* Shipping selection removed from cart - shipping is selected during checkout */}

      <View style={styles.footer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₦{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping (est.)</Text>
            <Text style={styles.summaryValue}>₦{shippingFee.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Coupon Discount</Text>
            <Text style={styles.summaryValue}>-₦{discountAmount.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>₦{total.toLocaleString()}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/checkout", params: { couponCode, discountAmount } })}
          style={[styles.checkoutBtn, { opacity: items.length === 0 ? 0.6 : 1 }]}
          disabled={items.length === 0}
        >
          <Text style={styles.checkoutText}>Proceed To Checkout</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 24 },
  header: { backgroundColor: COLORS.primary, paddingBottom: 18, paddingHorizontal: 16, paddingTop: 54 },
  title: { color: "#fff", fontSize: 25, fontFamily: "Syne_700Bold", fontWeight: "700" },
  list: { padding: 16 },
  cardBlock: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
  },
  sectionTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 16, fontWeight: "700" },
  input: {
    backgroundColor: "#fff",
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  smallBtn: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 10,
    paddingVertical: 10,
  },
  smallBtnText: { color: "#fff", fontWeight: "700" },
  couponMessage: { color: COLORS.primary, marginTop: 8 },
  choice: {
    backgroundColor: "#fff",
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  choiceActive: { borderColor: COLORS.primary },
  choiceText: { color: COLORS.text, fontWeight: "600" },
  linkInline: { marginTop: 10 },
  linkInlineText: { color: COLORS.primary, fontWeight: "700" },
  addressText: { color: COLORS.muted, marginTop: 8 },
  itemCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  summaryLabel: { color: COLORS.muted },
  summaryValue: { color: COLORS.text, fontWeight: "700" },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: COLORS.borderGray, marginTop: 8, paddingTop: 10 },
  summaryTotalLabel: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  summaryTotalValue: { color: COLORS.primary, fontSize: 18, fontWeight: "800" },
  itemName: { color: COLORS.text, fontSize: 16, fontFamily: "Syne_700Bold", fontWeight: "700" },
  itemMeta: { color: COLORS.muted, marginTop: 6 },
  itemPrice: { color: COLORS.primary, fontSize: 17, fontWeight: "700", marginTop: 6 },
  footer: {
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.borderGray,
    borderTopWidth: 1,
    padding: 16,
  },
  total: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  totalMeta: { color: COLORS.muted, marginTop: 4 },
  checkoutBtn: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    marginTop: 12,
    paddingVertical: 12,
  },
  checkoutText: { color: "#fff", fontWeight: "700" },
  todo: { color: COLORS.muted, fontSize: 12, marginHorizontal: 16, marginTop: 12 },
});