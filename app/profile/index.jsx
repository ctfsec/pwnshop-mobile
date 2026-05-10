import React from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator, Alert, ScrollView, Share, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { clearSession, getSession, getShippingPrefs, saveShippingPrefs } from "../../storage/insecure";
import { getWalletBalance, getWalletHistory } from "../../api/wallet";
import { getMyReferral, redeemReferralCode } from "../../api/referrals";

const ROLE_COLORS = {
  admin: { bg: "#FEF3C7", text: "#92400E" },
  seller: { bg: "#EDE9FE", text: "#5B21B6" },
  user: { bg: "#ECFDF5", text: "#065F46" },
};

function Avatar({ name }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, danger && styles.actionBtnDanger]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={danger ? "#DC2626" : COLORS.primary} />
      <Text style={[styles.actionBtnLabel, danger && { color: "#DC2626" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [balance, setBalance] = React.useState(null);
  const [transactions, setTransactions] = React.useState([]);
  const [referralCode, setReferralCode] = React.useState("");
  const [referralStats, setReferralStats] = React.useState(null);
  const [redeemCode, setRedeemCode] = React.useState("");
  const [redeemMessage, setRedeemMessage] = React.useState("");
  const [redeemLoading, setRedeemLoading] = React.useState(false);
  const [shippingAddress, setShippingAddress] = React.useState("");
  const [shippingMethod, setShippingMethod] = React.useState("delivery_default");
  const [shippingMessage, setShippingMessage] = React.useState("");
  const [shippingExpanded, setShippingExpanded] = React.useState(false);

  const refreshProfile = React.useCallback(() => {
    let cancelled = false;
    (async () => {
      const { user: storedUser } = await getSession();
      if (cancelled) return;
      setUser(storedUser);
      setReferralCode(storedUser?.referralCode || "");

      getShippingPrefs().then((prefs) => {
        if (!cancelled) {
          setShippingAddress(prefs.defaultAddress || "");
          setShippingMethod(prefs.defaultShippingMethod || "delivery_default");
        }
      }).catch(() => {});

      if (storedUser?.id) {
        getWalletBalance(storedUser.id).then((res) => {
          if (res?.ok && !cancelled) setBalance(res.data?.balance ?? null);
        }).catch(() => {});
        getWalletHistory(storedUser.id).then((res) => {
          if (res?.ok && !cancelled) setTransactions((res.data || []).slice(0, 5));
        }).catch(() => {});
        getMyReferral(storedUser.id).then((res) => {
          if (res?.ok && !cancelled) {
            setReferralStats(res.data || null);
            setReferralCode(res.data?.referralCode || storedUser?.referralCode || "");
          }
        }).catch(() => {});
      }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => { return refreshProfile(); }, [refreshProfile]);
  useFocusEffect(React.useCallback(() => refreshProfile(), [refreshProfile]));

  async function handleRedeemReferral() {
    if (!user?.id || !redeemCode.trim()) {
      setRedeemMessage("Enter a referral code first.");
      return;
    }
    setRedeemMessage("");
    setRedeemLoading(true);
    try {
      const response = await redeemReferralCode({ userId: user.id, referralCode: redeemCode.trim() });
      setRedeemMessage(`Bonus applied: +₦${Number(response.data?.bonusAmount || 0).toLocaleString()}`);
      const [balRes, histRes, refRes] = await Promise.all([
        getWalletBalance(user.id),
        getWalletHistory(user.id),
        getMyReferral(user.id),
      ]);
      if (balRes?.ok) setBalance(balRes.data?.balance ?? null);
      if (histRes?.ok) setTransactions((histRes.data || []).slice(0, 5));
      if (refRes?.ok) {
        setReferralStats(refRes.data || null);
        setReferralCode(refRes.data?.referralCode || referralCode);
      }
      setRedeemCode("");
    } catch (e) {
      setRedeemMessage(e.message || "Unable to redeem referral code.");
    } finally {
      setRedeemLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out", style: "destructive",
        onPress: async () => { await clearSession(); router.replace("/(auth)/login"); },
      },
    ]);
  }

  async function saveShippingDefaults() {
    setShippingMessage("");
    try {
      await saveShippingPrefs({ defaultAddress: shippingAddress, defaultShippingMethod: shippingMethod });
      setShippingMessage("Shipping preferences saved.");
    } catch (e) {
      setShippingMessage(e.message || "Unable to save.");
    }
  }

  const roleColors = ROLE_COLORS[user?.role] || ROLE_COLORS.user;
  const referralClaims = Array.isArray(referralStats?.claims) ? referralStats.claims.length : 0;

  if (!user) {
    return (
      <View style={styles.page}>
        <View style={styles.heroBar} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* Hero */}
      <View style={styles.hero}>
        <Avatar name={user.name} />
        <Text style={styles.heroName}>{user.name}</Text>
        <Text style={styles.heroEmail}>{user.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
          <Text style={[styles.roleBadgeText, { color: roleColors.text }]}>
            {(user.role || "user").toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard
            icon="wallet-outline"
            label="Wallet Balance"
            value={balance == null ? "—" : `₦${Number(balance).toLocaleString()}`}
          />
          <StatCard
            icon="people-outline"
            label="Referrals"
            value={referralClaims}
            sub={referralClaims === 1 ? "claim" : "claims"}
          />
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <ActionBtn icon="wallet-outline" label="Wallet" onPress={() => router.push("/wallet")} />
            <ActionBtn icon="heart-outline" label="Wishlist" onPress={() => router.push("/wishlist")} />
            <ActionBtn icon="receipt-outline" label="Orders" onPress={() => router.push("/orders")} />
            <ActionBtn icon="shield-checkmark-outline" label="2FA Setup" onPress={() => router.push("/2fa/setup")} />
            {user.role === "admin" && (
              <ActionBtn icon="settings-outline" label="Admin Panel" onPress={() => router.push("/admin/access")} />
            )}
          </View>
        </View>

        {/* Referral section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral Programme</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your Referral Code</Text>
            <View style={styles.referralRow}>
              <Text style={styles.referralCode} numberOfLines={1} ellipsizeMode="middle">{referralCode || "—"}</Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => Share.share({ message: `Use my PwnShop referral code: ${referralCode}` })}
              >
                <Ionicons name="share-social-outline" size={16} color={COLORS.primary} />
                <Text style={styles.copyBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardHint}>Both you and the new user get a ₦2,500 bonus on first redemption.</Text>

            <Text style={[styles.cardLabel, { marginTop: 14 }]}>Redeem a Code</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter referral code"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="characters"
                value={redeemCode}
                onChangeText={setRedeemCode}
              />
              <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeemReferral} disabled={redeemLoading}>
                {redeemLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.redeemBtnText}>Apply</Text>}
              </TouchableOpacity>
            </View>
            {redeemMessage ? (
              <Text style={[styles.cardHint, { color: COLORS.primary, marginTop: 6 }]}>{redeemMessage}</Text>
            ) : null}
          </View>
        </View>

        {/* Shipping preferences */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => setShippingExpanded(!shippingExpanded)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Shipping Preferences</Text>
            </View>
            <Ionicons name={shippingExpanded ? "chevron-up" : "chevron-down"} size={18} color={COLORS.muted} />
          </TouchableOpacity>
          {shippingExpanded && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Default Address</Text>
              <TextInput
                style={[styles.input, { flex: 0 }]}
                placeholder="Enter your default shipping address"
                placeholderTextColor={COLORS.muted}
                value={shippingAddress}
                onChangeText={setShippingAddress}
                multiline
              />
              <Text style={[styles.cardLabel, { marginTop: 12 }]}>Delivery Method</Text>
              {[
                { key: "delivery_default", label: "Home Delivery" },
                { key: "pickup_store", label: "Pickup From Store" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.methodOption, shippingMethod === opt.key && styles.methodOptionActive]}
                  onPress={() => setShippingMethod(opt.key)}
                >
                  <Ionicons
                    name={shippingMethod === opt.key ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={shippingMethod === opt.key ? COLORS.primary : COLORS.muted}
                  />
                  <Text style={[styles.methodLabel, shippingMethod === opt.key && { color: COLORS.primary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.saveBtn} onPress={saveShippingDefaults}>
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              </TouchableOpacity>
              {shippingMessage ? (
                <Text style={[styles.cardHint, { color: COLORS.primary, marginTop: 6 }]}>{shippingMessage}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Recent transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={32} color={COLORS.muted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {transactions.map((tx, idx) => {
                const isCredit = tx.amount >= 0;
                return (
                  <View key={tx.id} style={[styles.txRow, idx < transactions.length - 1 && styles.txRowBorder]}>
                    <View style={[styles.txIcon, { backgroundColor: isCredit ? "#ECFDF5" : "#FEF2F2" }]}>
                      <Ionicons
                        name={isCredit ? "arrow-down-outline" : "arrow-up-outline"}
                        size={16}
                        color={isCredit ? "#059669" : "#DC2626"}
                      />
                    </View>
                    <View style={styles.txMeta}>
                      <Text style={styles.txLabel}>{tx.label}</Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isCredit ? "#059669" : "#DC2626" }]}>
                      {isCredit ? "+" : "-"}₦{Math.abs(Number(tx.amount || 0)).toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },

  hero: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 28,
    gap: 4,
  },
  heroBar: { backgroundColor: COLORS.primary, height: 120 },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  heroName: { color: "#fff", fontSize: 20, fontWeight: "700", fontFamily: "Syne_700Bold" },
  heroEmail: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },
  roleBadge: {
    marginTop: 8, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },

  body: { padding: 16, gap: 4 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14,
    padding: 16, alignItems: "center", gap: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginTop: 6 },
  statSub: { fontSize: 11, color: COLORS.muted },
  statLabel: { fontSize: 12, color: COLORS.muted, marginTop: 2 },

  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 10 },

  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: {
    backgroundColor: COLORS.card, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    alignItems: "center", gap: 6, minWidth: "47%", flex: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  actionBtnDanger: { backgroundColor: "#FEF2F2" },
  actionBtnLabel: { fontSize: 12, fontWeight: "600", color: COLORS.text },

  card: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: "600" },
  cardHint: { fontSize: 12, color: COLORS.muted, lineHeight: 17, marginTop: 4 },

  referralRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  referralCode: {
    flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.primary,
    letterSpacing: 1, fontFamily: "Syne_700Bold",
  },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.background, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.borderGray,
    flexShrink: 0,
  },
  copyBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },

  inputRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  input: {
    flex: 1, backgroundColor: COLORS.background,
    borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 11, color: COLORS.text, fontSize: 14,
  },
  redeemBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 16, justifyContent: "center",
  },
  redeemBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  accordionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 8,
  },

  methodOption: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderRadius: 8,
    paddingHorizontal: 4,
  },
  methodOptionActive: {},
  methodLabel: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 12, alignItems: "center", marginTop: 14,
  },
  saveBtnText: { color: "#fff", fontWeight: "700" },

  emptyCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 32,
    alignItems: "center", gap: 8,
  },
  emptyText: { color: COLORS.muted, fontSize: 13 },

  txRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12,
  },
  txRowBorder: {
    borderBottomWidth: 1, borderBottomColor: COLORS.borderGray,
  },
  txIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  txMeta: { flex: 1 },
  txLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  txDate: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700" },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 8, paddingVertical: 14,
    backgroundColor: "#FEF2F2", borderRadius: 12,
    borderWidth: 1, borderColor: "#FECACA",
  },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
