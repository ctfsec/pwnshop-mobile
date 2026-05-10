import React from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../constants/colors";
import { clearSession, getSession } from "../../storage/insecure";
import { getShippingPrefs, saveShippingPrefs } from "../../storage/insecure";
import { getWalletBalance, getWalletHistory } from "../../api/wallet";
import { getMyReferral, redeemReferralCode } from "../../api/referrals";

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
      if (cancelled) {
        return;
      }

      setUser(storedUser);
      setReferralCode(storedUser?.referralCode || "");

      getShippingPrefs().then((prefs) => {
        if (!cancelled) {
          setShippingAddress(prefs.defaultAddress || "");
          setShippingMethod(prefs.defaultShippingMethod || "delivery_default");
        }
      }).catch(() => {});

      if (storedUser && storedUser.id) {
        getWalletBalance(storedUser.id).then((res) => {
          if (res && res.ok && !cancelled) {
            setBalance(res.data?.balance ?? null);
          }
        }).catch(() => {});

        getWalletHistory(storedUser.id).then((res) => {
          if (res && res.ok && !cancelled) {
            setTransactions((res.data || []).slice(0, 10));
          }
        }).catch(() => {});

        getMyReferral(storedUser.id).then((res) => {
          if (res && res.ok && !cancelled) {
            setReferralStats(res.data || null);
            setReferralCode(res.data?.referralCode || storedUser?.referralCode || "");
          }
        }).catch(() => {});
      }
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    return refreshProfile();
  }, [refreshProfile]);

  useFocusEffect(
    React.useCallback(() => refreshProfile(), [refreshProfile])
  );

  async function handleRedeemReferral() {
    if (!user?.id || !redeemCode.trim()) {
      setRedeemMessage("Enter a referral code first.");
      return;
    }

    setRedeemMessage("");
    setRedeemLoading(true);
    try {
      const response = await redeemReferralCode({
        userId: user.id,
        referralCode: redeemCode.trim(),
      });
      setRedeemMessage(`Referral applied. Bonus: ₦${Number(response.data?.bonusAmount || 0).toLocaleString()}`);

      const [balanceRes, historyRes, referralRes] = await Promise.all([
        getWalletBalance(user.id),
        getWalletHistory(user.id),
        getMyReferral(user.id),
      ]);

      if (balanceRes?.ok) {
        setBalance(balanceRes.data?.balance ?? null);
      }
      if (historyRes?.ok) {
        setTransactions((historyRes.data || []).slice(0, 10));
      }
      if (referralRes?.ok) {
        setReferralStats(referralRes.data || null);
        setReferralCode(referralRes.data?.referralCode || referralCode);
      }
      setRedeemCode("");
    } catch (error) {
      setRedeemMessage(error.message || "Unable to redeem referral code");
    } finally {
      setRedeemLoading(false);
    }
  }

  async function handleLogout() {
    await clearSession();
    router.replace("/(auth)/login");
  }

  async function saveShippingDefaults() {
    setShippingMessage("");
    try {
      await saveShippingPrefs({ defaultAddress: shippingAddress, defaultShippingMethod: shippingMethod });
      setShippingMessage("Shipping preferences saved.");
    } catch (error) {
      setShippingMessage(error.message || "Unable to save shipping preferences");
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {user ? (
          <>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user.name}</Text>

            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>

            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{user.role}</Text>

            <Text style={styles.label}>Referral Code</Text>
            <Text style={styles.value}>{referralCode || user.referralCode || "—"}</Text>
            <Text style={styles.referralNote}>Share this code. Both users get a bonus when it is redeemed.</Text>

            <Text style={styles.label}>Redeem Referral Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter referral code"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="characters"
              value={redeemCode}
              onChangeText={setRedeemCode}
            />
            {redeemMessage ? <Text style={styles.redeemMessage}>{redeemMessage}</Text> : null}
            <TouchableOpacity onPress={handleRedeemReferral} style={styles.cta} disabled={redeemLoading}>
              {redeemLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Redeem Code</Text>}
            </TouchableOpacity>

            {referralStats ? (
              <Text style={styles.referralSummary}>
                Referral claims: {Array.isArray(referralStats.claims) ? referralStats.claims.length : 0}
              </Text>
            ) : null}

            <Text style={styles.label}>Wallet Balance</Text>
            <Text style={styles.value}>{balance == null ? "—" : `₦${Number(balance || 0).toLocaleString()}`}</Text>

            <TouchableOpacity onPress={() => router.push('/wallet')} style={styles.secondaryCta}>
              <Text style={styles.secondaryCtaText}>Open Wallet</Text>
            </TouchableOpacity>

            {user.role === "admin" ? (
              <TouchableOpacity onPress={() => router.push('/admin/access')} style={styles.adminCta}>
                <Text style={styles.adminCtaText}>Open Admin Panel</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={() => router.push('/2fa/setup')} style={styles.secondaryCta}>
              <Text style={styles.secondaryCtaText}>Set Up Two-Factor Authentication</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/wishlist')} style={styles.secondaryCta}>
              <Text style={styles.secondaryCtaText}>Open Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShippingExpanded(!shippingExpanded)} style={styles.adminCta}>
              <Text style={styles.adminCtaText}>{shippingExpanded ? "Hide" : "Edit"} Shipping Preferences</Text>
            </TouchableOpacity>

            {shippingExpanded ? (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>Shipping Preferences</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Default shipping address"
                  placeholderTextColor={COLORS.muted}
                  value={shippingAddress}
                  onChangeText={setShippingAddress}
                />
                <TouchableOpacity
                  onPress={() => setShippingMethod("delivery_default")}
                  style={[styles.secondaryCta, shippingMethod === "delivery_default" && styles.shippingActive]}
                >
                  <Text style={styles.secondaryCtaText}>Default Delivery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShippingMethod("pickup_store")}
                  style={[styles.secondaryCta, shippingMethod === "pickup_store" && styles.shippingActive]}
                >
                  <Text style={styles.secondaryCtaText}>Pickup From Physical Store</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveShippingDefaults} style={styles.cta}>
                  <Text style={styles.ctaText}>Save Shipping Preferences</Text>
                </TouchableOpacity>
                {shippingMessage ? <Text style={styles.redeemMessage}>{shippingMessage}</Text> : null}
              </>
            ) : null}

            <Text style={[styles.label, { marginTop: 16 }]}>Recent Transactions</Text>
            {transactions.length === 0 ? (
              <Text style={{ color: COLORS.muted, marginTop: 8 }}>No recent transactions.</Text>
            ) : (
              transactions.slice(0,5).map((tx) => (
                <View key={tx.id} style={{ marginTop: 8 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700' }}>{tx.label}</Text>
                  <Text style={{ color: COLORS.muted }}>{new Date(tx.createdAt).toLocaleString()}</Text>
                  <Text style={{ color: COLORS.text }}>{tx.amount < 0 ? '-' : '+'}₦{Math.abs(Number(tx.amount || 0)).toLocaleString()}</Text>
                </View>
              ))
            )}

            <TouchableOpacity onPress={handleLogout} style={styles.cta}>
              <Text style={styles.ctaText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/orders")} style={styles.secondaryCta}>
              <Text style={styles.secondaryCtaText}>Order History</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ marginBottom: 12, color: COLORS.muted }}>Not signed in.</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.cta}>
              <Text style={styles.ctaText}>Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: { alignItems: "center", backgroundColor: COLORS.primary, paddingTop: 54, paddingBottom: 14 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700" },
  body: { padding: 16 },
  bodyContent: { paddingBottom: 24 },
  label: { color: COLORS.muted, marginTop: 12 },
  value: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  referralNote: { color: COLORS.muted, marginTop: 4, lineHeight: 18 },
  input: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  redeemMessage: { color: COLORS.primary, marginTop: 8 },
  referralSummary: { color: COLORS.muted, marginTop: 8 },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 18, paddingVertical: 12 },
  ctaText: { color: "#fff", fontWeight: "700" },
  secondaryCta: { alignItems: "center", backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, marginTop: 12, paddingVertical: 12 },
  secondaryCtaText: { color: COLORS.primary, fontWeight: "700" },
  adminCta: { alignItems: "center", backgroundColor: "#1737AA", borderRadius: 8, marginTop: 12, paddingVertical: 12 },
  adminCtaText: { color: "#fff", fontWeight: "700" },
  shippingActive: { borderColor: COLORS.primary },
});
