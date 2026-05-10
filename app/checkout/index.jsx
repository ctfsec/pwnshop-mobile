import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { COLORS } from "../../constants/colors";
import { createOrder } from "../../api/orders";
import { useCart } from "../context/CartContext";
import { getSession, getShippingPrefs, saveShippingPrefs } from "../../storage/insecure";
import { getWalletBalance } from "../../api/wallet";
import { useLocalSearchParams } from "expo-router";
import { STORES } from "../../constants/stores";

// PWN-M022: FLAG_SECURE is intentionally NOT set on this screen.
// This vulnerability allows screenshots and screen recordings to capture sensitive payment data.
// In a real app, this screen should have android:windowNoDisplay or FLAG_SECURE set.
// See: https://owasp.org/www-community/attacks/Screenshot_Attack

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { items, clearCart } = useCart();
  const [userId, setUserId] = useState("u1");
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [couponCode, setCouponCode] = useState(String(params.couponCode || ""));
  const [shippingMethod, setShippingMethod] = useState(String(params.shippingMethod || "delivery_default"));
  const [shippingAddress, setShippingAddress] = useState(String(params.defaultAddress || ""));
  const [shippingNote, setShippingNote] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [vulnBankCardNumber, setVulnBankCardNumber] = useState("");
  const [vulnBankExpiry, setVulnBankExpiry] = useState("");
  const [vulnBankCvv, setVulnBankCvv] = useState("");

  useEffect(() => {
    let mounted = true;
    getSession().then(async ({ user }) => {
      const nextUserId = user?.id || "u1";
      if (!mounted) return;
      setUserId(nextUserId);

      try {
        const response = await getWalletBalance(nextUserId);
        if (mounted) {
          setWalletBalance(response.data?.balance || 0);
        }
      } catch (error) {
        if (mounted) {
          setMessage(error.message || "Unable to load wallet balance");
        }
      } finally {
        if (mounted) {
          setBalanceLoading(false);
        }
      }

      const shippingPrefs = await getShippingPrefs();
      if (mounted) {
        setShippingAddress((current) => current || shippingPrefs.defaultAddress || "");
        if (!params.shippingMethod) {
          setShippingMethod(shippingPrefs.defaultShippingMethod || "delivery_default");
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  function parsePrice(value) {
    if (typeof value === "number") return value;
    return Number(String(value || 0).replace(/[^0-9.]/g, "")) || 0;
  }

  function handleVulnBankCardChange(text) {
    const digits = text.replace(/\D/g, "").slice(0, 16);
    setVulnBankCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
  }

  function handleExpiryChange(text) {
    const prev = vulnBankExpiry;
    const digits = text.replace(/[^0-9]/g, "").slice(0, 4);
    if (digits.length === 0) { setVulnBankExpiry(""); return; }
    if (digits.length <= 2) {
      if (digits.length === 2 && prev.length < 3) {
        setVulnBankExpiry(`${digits}/`);
      } else {
        setVulnBankExpiry(digits);
      }
    } else {
      setVulnBankExpiry(`${digits.slice(0, 2)}/${digits.slice(2, 4)}`);
    }
  }

  const subtotal = items.reduce((sum, item) => sum + parsePrice(item.price) * (item.qty || 1), 0);
  const shippingFee = items.reduce((sum, item) => sum + Number(item.shippingFeeNaira || 0) * (item.qty || 1), 0) + (shippingMethod === "pickup_store" ? 500 : 1500);
  const clientDiscount = Number(params.discountAmount || 0);
  const total = Math.max(0, subtotal + shippingFee - clientDiscount);

  async function persistShippingPrefs(nextAddress = shippingAddress, nextMethod = shippingMethod) {
    await saveShippingPrefs({ defaultAddress: nextAddress, defaultShippingMethod: nextMethod });
  }

  async function handleShippingMethod(nextMethod) {
    setShippingMethod(nextMethod);
    if (nextMethod !== "pickup_store") {
      setSelectedStore(null);
      setShippingNote("Default delivery selected.");
    } else {
      setShippingNote("");
    }
    await persistShippingPrefs(shippingAddress, nextMethod);
  }

  function handleSelectStore(store) {
    setSelectedStore(store);
    setShippingAddress(store.address);
    setShippingNote(`Pickup at ${store.name}`);
  }

  async function handlePlaceOrder() {
    if (shippingMethod === "pickup_store" && !selectedStore) {
      setMessage("Please select a pickup store to continue.");
      return;
    }

    if (paymentMethod === "vulnbank") {
      const rawDigits = vulnBankCardNumber.replace(/\s/g, "");
      if (rawDigits.length !== 16) {
        setMessage("Card number must be 16 digits");
        return;
      }
      const [mm, yy] = vulnBankExpiry.split("/");
      if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12 || yy.length !== 2) {
        setMessage("Enter a valid expiry date (MM/YY)");
        return;
      }
      if (vulnBankCvv.length < 3 || vulnBankCvv.length > 4) {
        setMessage("CVV must be 3 or 4 digits");
        return;
      }
    }

    setMessage("");
    setLoading(true);

    try {
      const response = await createOrder({
        userId,
        items: items.map((item) => ({
          id: item.id,
          productId: item.id,
          name: item.name,
          qty: item.qty || 1,
          priceNaira: parsePrice(item.price),
            shippingFeeNaira: Number(item.shippingFeeNaira || 0),
        })),
        paymentMethod,
          couponCode,
          discountAmount: clientDiscount,
          shippingMethod,
          shippingAddress,
        vulnBankCardNumber: paymentMethod === "vulnbank" ? vulnBankCardNumber : undefined,
        vulnBankExpiry: paymentMethod === "vulnbank" ? vulnBankExpiry : undefined,
        vulnBankCvv: paymentMethod === "vulnbank" ? vulnBankCvv : undefined,
      });

      clearCart();
      const storeName = selectedStore ? encodeURIComponent(selectedStore.name) : "";
      const storeAddress = selectedStore ? encodeURIComponent(selectedStore.address) : "";
      router.replace(
        `/checkout/confirm?orderId=${response.data.id}&total=${total}&storePickup=${shippingMethod === "pickup_store" ? "1" : "0"}&storeName=${storeName}&storeAddress=${storeAddress}`
      );
    } catch (error) {
      setMessage(error.message || "Unable to place order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.info}>Review your cart and place the order.</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{items.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₦{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>₦{shippingFee.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryValue}>₦{clientDiscount.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>₦{total.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Wallet Balance</Text>
            <Text style={styles.summaryValue}>{balanceLoading ? "Loading..." : `₦${walletBalance.toLocaleString()}`}</Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>

          <TouchableOpacity onPress={() => handleShippingMethod("delivery_default")} style={[styles.radioRow, shippingMethod === "delivery_default" && styles.radioRowActive]}>
            <View style={styles.radioInner}>
              <Ionicons name={shippingMethod === "delivery_default" ? "radio-button-on" : "radio-button-off"} size={16} color={COLORS.primary} />
              <View>
                <Text style={styles.radioLabel}>Home Delivery</Text>
                <Text style={styles.radioHint}>Delivered to your address</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleShippingMethod("pickup_store")} style={[styles.radioRow, shippingMethod === "pickup_store" && styles.radioRowActive]}>
            <View style={styles.radioInner}>
              <Ionicons name={shippingMethod === "pickup_store" ? "radio-button-on" : "radio-button-off"} size={16} color={COLORS.primary} />
              <View>
                <Text style={styles.radioLabel}>Store Pickup</Text>
                <Text style={styles.radioHint}>Collect from a Pwnshop store at a lower rate</Text>
              </View>
            </View>
          </TouchableOpacity>

          {shippingMethod === "delivery_default" && (
            <View style={{ marginTop: 10 }}>
              <TextInput
                style={styles.input}
                value={shippingAddress}
                onChangeText={setShippingAddress}
                placeholder="Enter delivery address"
              />
              <TouchableOpacity onPress={() => persistShippingPrefs(shippingAddress, shippingMethod)} style={[styles.secondaryCta, { marginTop: 8 }]}>
                <Text style={styles.secondaryCtaText}>Save As Default Address</Text>
              </TouchableOpacity>
            </View>
          )}

          {shippingMethod === "pickup_store" && (
            <View style={styles.storePickerWrap}>
              <TextInput
                style={[styles.input, { marginTop: 10, marginBottom: 8 }]}
                value={storeSearch}
                onChangeText={setStoreSearch}
                placeholder="Search by state (e.g. Lagos, Abuja, Kano…)"
                returnKeyType="search"
              />
              {(() => {
                const filtered = storeSearch.trim()
                  ? STORES.filter((s) =>
                      s.state.toLowerCase().includes(storeSearch.toLowerCase()) ||
                      s.name.toLowerCase().includes(storeSearch.toLowerCase())
                    )
                  : STORES;
                if (filtered.length === 0) {
                  return (
                    <View style={styles.noStoreBox}>
                      <Ionicons name="location-outline" size={28} color={COLORS.muted} />
                      <Text style={styles.noStoreText}>No Pwnshop store in "{storeSearch}" yet.</Text>
                      <Text style={styles.noStoreSub}>Switch to Home Delivery or choose the nearest state.</Text>
                    </View>
                  );
                }
                return filtered.map((store) => {
                  const isSelected = selectedStore?.id === store.id;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      onPress={() => handleSelectStore(store)}
                      style={[styles.storeOption, isSelected && styles.storeOptionActive]}
                    >
                      <View style={styles.storeOptionTop}>
                        <View style={[styles.storeStateDot, { backgroundColor: store.stateColor }]} />
                        <Text style={[styles.storeOptionName, isSelected && { color: COLORS.primary }]}>
                          {store.name}
                        </Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />}
                      </View>
                      <Text style={styles.storeOptionAddr}>{store.address}</Text>
                      <Text style={styles.storeOptionHours}>{store.hours}</Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
          )}

          {shippingNote ? <Text style={styles.shippingNote}>{shippingNote}</Text> : null}
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Coupon</Text>
          <TextInput style={styles.input} value={couponCode} onChangeText={setCouponCode} placeholder="Coupon code" autoCapitalize="characters" />
          <Text style={styles.radioHint}>Validate in cart and send to checkout.</Text>
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity onPress={() => setPaymentMethod("wallet")} style={[styles.radioRow, paymentMethod === "wallet" && styles.radioRowActive]}>
            <Text style={styles.radioLabel}>Pay with PwnShop Wallet</Text>
            <Text style={styles.radioHint}>Balance deducted from your wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaymentMethod("vulnbank")} style={[styles.radioRow, paymentMethod === "vulnbank" && styles.radioRowActive]}>
            <Text style={styles.radioLabel}>Pay with VulnBank Direct</Text>
            <Text style={styles.radioHint}>Deduct directly from VulnBank account</Text>
          </TouchableOpacity>

          {paymentMethod === "vulnbank" ? (
            <View style={styles.vulnForm}>
              <Text style={styles.cardFieldLabel}>Card Number</Text>
              <View style={styles.cardFieldWrap}>
                <Ionicons name="card-outline" size={18} color={COLORS.muted} style={styles.cardFieldIcon} />
                <TextInput
                  style={styles.cardFieldInput}
                  value={vulnBankCardNumber}
                  onChangeText={handleVulnBankCardChange}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardFieldLabel}>Expiry Date</Text>
                  <View style={styles.cardFieldWrap}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.muted} style={styles.cardFieldIcon} />
                    <TextInput
                      style={styles.cardFieldInput}
                      value={vulnBankExpiry}
                      onChangeText={handleExpiryChange}
                      placeholder="MM/YY"
                      placeholderTextColor={COLORS.muted}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.cardFieldLabel}>CVV / CVC</Text>
                  <View style={styles.cardFieldWrap}>
                    <Ionicons name="lock-closed-outline" size={16} color={COLORS.muted} style={styles.cardFieldIcon} />
                    <TextInput
                      style={styles.cardFieldInput}
                      value={vulnBankCvv}
                      onChangeText={setVulnBankCvv}
                      placeholder="3-digit code"
                      placeholderTextColor={COLORS.muted}
                      secureTextEntry
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity onPress={handlePlaceOrder} style={styles.cta} disabled={items.length === 0 || loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Place Order</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/orders")} style={[styles.secondaryCta, { opacity: items.length === 0 ? 1 : 1 }]}>
          <Text style={styles.secondaryCtaText}>View Order History</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.linkBtn}>
          <Text style={styles.linkText}>Return Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: { alignItems: "center", backgroundColor: COLORS.primary, flexDirection: "row", gap: 10, paddingBottom: 14, paddingHorizontal: 16, paddingTop: 54 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700" },
  body: { padding: 16 },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  summaryLabel: { color: COLORS.muted },
  summaryValue: { color: COLORS.text, fontWeight: "700" },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: COLORS.borderGray, marginTop: 8, paddingTop: 10 },
  summaryTotalLabel: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  summaryTotalValue: { color: COLORS.primary, fontSize: 18, fontWeight: "800" },
  info: { color: COLORS.text, marginBottom: 20 },
  summary: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  message: { color: COLORS.primary, marginBottom: 12 },
  paymentCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 14,
    padding: 14,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontFamily: "Syne_700Bold", fontWeight: "700", marginBottom: 10 },
  radioRow: {
    backgroundColor: "#fff",
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  radioRowActive: {
    borderColor: COLORS.primary,
  },
  radioInner: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
  radioLabel: { color: COLORS.text, fontWeight: "700" },
  radioHint: { color: COLORS.muted, marginTop: 2, fontSize: 12 },
  shippingNote: { color: "#0B7A4B", fontWeight: "600", fontSize: 13, marginTop: 8 },
  noStoreBox: { alignItems: "center", padding: 20 },
  noStoreText: { color: COLORS.text, fontWeight: "700", fontSize: 14, marginTop: 8, textAlign: "center" },
  noStoreSub: { color: COLORS.muted, fontSize: 12, marginTop: 4, textAlign: "center" },
  vulnForm: { marginTop: 12 },
  rowInputs: { flexDirection: "row", marginTop: 10 },
  cardFieldLabel: { color: COLORS.text, fontSize: 12, fontWeight: "600", marginBottom: 4, marginTop: 12 },
  cardFieldWrap: { alignItems: "center", backgroundColor: COLORS.background, borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, flexDirection: "row", paddingHorizontal: 10 },
  cardFieldIcon: { marginRight: 8 },
  cardFieldInput: { color: COLORS.text, flex: 1, fontSize: 15, paddingVertical: 12 },
  cardRow: { flexDirection: "row" },
  input: {
    backgroundColor: "#fff",
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  storePickerWrap: { marginTop: 4 },
  storeOption: {
    backgroundColor: "#fff",
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    padding: 12,
  },
  storeOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "08" },
  storeOptionTop: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 4 },
  storeStateDot: { borderRadius: 4, height: 8, width: 8 },
  storeOptionName: { color: COLORS.text, flex: 1, fontWeight: "700", fontSize: 13 },
  storeOptionAddr: { color: COLORS.muted, fontSize: 12, marginBottom: 2 },
  storeOptionHours: { color: COLORS.muted, fontSize: 11 },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 12 },
  ctaText: { color: "#fff", fontWeight: "700" },
  secondaryCta: { alignItems: "center", backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, marginTop: 12, paddingVertical: 12 },
  secondaryCtaText: { color: COLORS.primary, fontWeight: "700" },
  linkBtn: { marginTop: 12 },
  linkText: { color: COLORS.muted, fontWeight: "600", textAlign: "center" },
});
