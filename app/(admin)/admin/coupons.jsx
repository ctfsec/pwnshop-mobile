import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../constants/colors";
import { createAdminCoupon, getAdminCoupons, updateAdminCoupon } from "../../../api/admin";

const CATEGORIES = [
  { key: "all", label: "All Categories" },
  { key: "Fashion", label: "Fashion" },
  { key: "Computers & Accessories", label: "Computers" },
  { key: "Phones", label: "Phones" },
  { key: "Electronics", label: "Electronics" },
  { key: "Home & Kitchen", label: "Home & Kitchen" },
  { key: "Beauty & Health", label: "Beauty & Health" },
];

export default function AdminCouponsScreen() {
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 20 : 0;
  const [coupons, setCoupons] = useState([]);
  const [type, setType] = useState("percentage");
  const [discount, setDiscount] = useState("10");
  const [fixedAmount, setFixedAmount] = useState("500");
  const [minOrder, setMinOrder] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [lastCode, setLastCode] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  async function load() {
    try {
      const res = await getAdminCoupons();
      setCoupons(res.data || []);
    } catch (e) {
      setMessage(e.message || "Unable to load coupons");
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setMessage("");
    try {
      const payload = {
        type,
        discountPercent: type === "percentage" ? Number(discount || 10) : 0,
        discountFixed: type === "fixed" ? Number(fixedAmount || 500) : 0,
        minOrder: Number(minOrder || 0),
        usageLimit: Number(usageLimit || 0),
        expiryDate: expiryDate.trim(),
        category,
      };
      const res = await createAdminCoupon(payload);
      setLastCode(res.data?.code || "");
      setDiscount("10"); setFixedAmount("500"); setMinOrder(""); setUsageLimit(""); setExpiryDate(""); setCategory("all");
      await load();
      setMessage("Coupon generated.");
    } catch (e) {
      setMessage(e.message || "Unable to create coupon");
    }
  }

  async function toggleCoupon(coupon) {
    setMessage("");
    try {
      await updateAdminCoupon(coupon.id, { active: !coupon.active });
      await load();
      setMessage(`${coupon.code} ${coupon.active ? "deactivated" : "activated"}.`);
    } catch (e) {
      setMessage(e.message || "Unable to update coupon");
    }
  }

  async function copyCode(coupon) {
    await Clipboard.setStringAsync(coupon.code);
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function couponSummary(c) {
    if (c.type === "fixed") return `₦${Number(c.discountFixed || 0).toLocaleString()} off`;
    return `${c.discountPercent || 0}% off`;
  }

  function categoryLabel(key) {
    const found = CATEGORIES.find(c => c.key === key);
    return found ? found.label : key;
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 30 + bottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Coupon Management</Text>
        <Text style={styles.subtitle}>Generate discount codes with full configuration.</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>New Coupon</Text>

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {["percentage", "fixed"].map((t) => (
            <TouchableOpacity key={t} onPress={() => setType(t)} style={[styles.typeBtn, type === t && styles.typeBtnActive]}>
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                {t === "percentage" ? "% Off" : "₦ Fixed"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === "percentage" ? (
          <>
            <Text style={styles.label}>Discount %</Text>
            <TextInput style={styles.input} value={discount} onChangeText={setDiscount} keyboardType="number-pad" placeholder="10" placeholderTextColor={COLORS.muted} />
          </>
        ) : (
          <>
            <Text style={styles.label}>Discount Amount (₦)</Text>
            <TextInput style={styles.input} value={fixedAmount} onChangeText={setFixedAmount} keyboardType="number-pad" placeholder="500" placeholderTextColor={COLORS.muted} />
          </>
        )}

        <Text style={styles.label}>Category Restriction</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setCategory(cat.key)}
              style={[styles.catChip, category === cat.key && styles.catChipActive]}
            >
              <Text style={[styles.catChipText, category === cat.key && styles.catChipTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Min Order Value (₦, 0 = no minimum)</Text>
        <TextInput style={styles.input} value={minOrder} onChangeText={setMinOrder} keyboardType="number-pad" placeholder="0" placeholderTextColor={COLORS.muted} />

        <Text style={styles.label}>Usage Limit (0 = unlimited)</Text>
        <TextInput style={styles.input} value={usageLimit} onChangeText={setUsageLimit} keyboardType="number-pad" placeholder="0" placeholderTextColor={COLORS.muted} />

        <Text style={styles.label}>Expiry Date (YYYY-MM-DD, blank = no expiry)</Text>
        <TextInput style={styles.input} value={expiryDate} onChangeText={setExpiryDate} placeholder="2026-12-31" placeholderTextColor={COLORS.muted} />

        <TouchableOpacity onPress={handleCreate} style={styles.createBtn}>
          <Text style={styles.btnText}>Generate Coupon (auto PWNS-XXXX-XXXX)</Text>
        </TouchableOpacity>

        {lastCode ? <Text style={styles.generated}>Generated: {lastCode}</Text> : null}
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {(coupons || []).map((coupon) => (
        <View key={coupon.id} style={[styles.card, !coupon.active && styles.cardInactive]}>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{coupon.code}</Text>
            <View style={styles.codeActions}>
              <TouchableOpacity onPress={() => copyCode(coupon)} style={styles.copyBtn}>
                <Ionicons
                  name={copiedId === coupon.id ? "checkmark-circle" : "copy-outline"}
                  size={18}
                  color={copiedId === coupon.id ? COLORS.accent : COLORS.primary}
                />
              </TouchableOpacity>
              {!coupon.active && <View style={styles.inactiveBadge}><Text style={styles.inactiveBadgeText}>OFF</Text></View>}
            </View>
          </View>
          <Text style={styles.meta}>
            {couponSummary(coupon)}
            {coupon.minOrder > 0 ? ` · Min ₦${Number(coupon.minOrder).toLocaleString()}` : ""}
            {coupon.usageLimit > 0 ? ` · Limit: ${coupon.usageCount}/${coupon.usageLimit}` : ` · Used: ${coupon.usageCount || 0}`}
          </Text>
          {coupon.category && coupon.category !== "all" && (
            <Text style={styles.categoryTag}>Category: {categoryLabel(coupon.category)}</Text>
          )}
          {coupon.expiryDate ? <Text style={styles.meta}>Expires: {coupon.expiryDate}</Text> : null}
          <TouchableOpacity onPress={() => toggleCoupon(coupon)} style={[styles.toggleBtn, coupon.active && styles.toggleDeactivate]}>
            <Text style={styles.btnText}>{coupon.active ? "Deactivate" : "Activate"}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16,  paddingTop: 54 },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 5 },
  formCard: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 12, borderWidth: 1, marginTop: 14, padding: 16 },
  formTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 16, marginBottom: 8 },
  label: { color: COLORS.muted, fontSize: 12, marginTop: 10 },
  input: { backgroundColor: "#fff", borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, color: COLORS.text, marginTop: 4, paddingHorizontal: 12, paddingVertical: 10 },
  typeRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  typeBtn: { alignItems: "center", borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, flex: 1, paddingVertical: 10 },
  typeBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  typeBtnText: { color: COLORS.muted, fontWeight: "700" },
  typeBtnTextActive: { color: "#fff" },
  catRow: { marginTop: 6 },
  catChip: { borderColor: COLORS.borderGray, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  catChipTextActive: { color: "#fff" },
  createBtn: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 14, paddingVertical: 12 },
  generated: { color: "#0B7A4B", fontWeight: "700", marginTop: 8, textAlign: "center" },
  message: { color: COLORS.primary, fontWeight: "600", marginTop: 10 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 12 },
  cardInactive: { opacity: 0.55 },
  codeRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  codeActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  code: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 16 },
  copyBtn: { padding: 4 },
  inactiveBadge: { backgroundColor: COLORS.muted, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  inactiveBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  meta: { color: COLORS.muted, fontSize: 13, marginTop: 3 },
  categoryTag: { color: COLORS.primary, fontSize: 12, fontWeight: "600", marginTop: 4 },
  toggleBtn: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 10, paddingVertical: 9 },
  toggleDeactivate: { backgroundColor: "#B00020" },
  btnText: { color: "#fff", fontWeight: "700" },
});
