import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { fundWallet, getWalletBalance, getWalletHistory } from "../../api/wallet";
import { getMyReferral, redeemReferralCode } from "../../api/referrals";
import { getSession } from "../../storage/insecure";

// PWN-M022: FLAG_SECURE is intentionally NOT set on this screen.
// This vulnerability allows screenshots and screen recordings to capture sensitive wallet data.
// In a real app, this screen should have android:windowNoDisplay or FLAG_SECURE set.
// See: https://owasp.org/www-community/attacks/Screenshot_Attack

export default function WalletScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState("u1");
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [walletToken, setWalletToken] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [message, setMessage] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [amount, setAmount] = useState("1000");
  const [referralCode, setReferralCode] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);

  const loadWallet = useCallback(async (nextUserId = userId) => {
    setLoading(true);
    try {
      const [balanceRes, historyRes] = await Promise.all([
        getWalletBalance(nextUserId),
        getWalletHistory(nextUserId),
      ]);

      setBalance(balanceRes.data?.balance || 0);
      setPending(balanceRes.data?.pending || 0);
      setWalletToken(balanceRes.data?.walletToken || "");
      setTransactions(historyRes.data || []);
    } catch (error) {
      setMessage(error.message || "Unable to load wallet");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshWallet = useCallback(() => {
    let cancelled = false;

    (async () => {
      const { user: storedUser } = await getSession();
      if (cancelled) {
        return;
      }

      const nextUserId = storedUser?.id || "u1";
      setUserId(nextUserId);
      await loadWallet(nextUserId);

      getMyReferral(nextUserId).then((res) => {
        if (res && res.ok && !cancelled) {
          setReferralCode(res.data?.referralCode || "");
        }
      }).catch(() => {});
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [loadWallet]);

  useEffect(() => {
    return refreshWallet();
  }, [refreshWallet]);

  useFocusEffect(
    useCallback(() => refreshWallet(), [refreshWallet])
  );

  async function handleFundWallet() {
    setMessage("");
    setFunding(true);

    try {
      await fundWallet({
        userId,
        cardNumber,
        expiryDate: expiry,
        cvv,
        amount: Number(amount || 0),
      });
      setMessage(`₦${Number(amount || 0).toLocaleString()} added via VulnBank transfer.`);
      await loadWallet(userId);
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setAmount("1000");
    } catch (error) {
      setMessage(error.message || "Unable to fund wallet");
    } finally {
      setFunding(false);
    }
  }

  function handleExpiryChange(text) {
    // Remove non-digits
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 2) {
      setExpiry(cleaned);
    } else if (cleaned.length === 3) {
      // Auto-insert slash after first 2 digits: "052" -> "05/2"
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      // Keep only MM/YY format
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    }
  }

  async function handleRedeemReferral() {
    if (!referralCode.trim()) {
      setReferralMessage("Enter a referral code first.");
      return;
    }

    setReferralMessage("");
    setReferralLoading(true);

    try {
      const response = await redeemReferralCode({
        userId,
        referralCode: referralCode.trim(),
      });

      setReferralMessage(`Referral applied. Bonus: ₦${Number(response.data?.bonusAmount || 0).toLocaleString()}`);
      await loadWallet(userId);
    } catch (error) {
      setReferralMessage(error.message || "Unable to redeem referral code");
    } finally {
      setReferralLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>₦{Number(balance || 0).toLocaleString()}</Text>
          <Text style={styles.pendingValue}>Pending: ₦{Number(pending || 0).toLocaleString()}</Text>
          {walletToken ? (
            <View style={styles.tokenRow}>
              <Text style={styles.tokenLabel}>Wallet Security Token</Text>
              {/* PWN-M020: AES-ECB — no IV. Same balance always produces same token. */}
              <Text style={styles.tokenValue} numberOfLines={1}>{walletToken}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Fund via VulnBank</Text>
          <Text style={styles.sectionText}>Use your VulnBank card to transfer money into your PwnShop wallet.</Text>

          <TextInput style={styles.input} placeholder="Card Number (16 digits)" value={cardNumber} onChangeText={setCardNumber} keyboardType="numeric" />
          <View style={styles.rowInputs}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="MM/YY" value={expiry} onChangeText={handleExpiryChange} keyboardType="numeric" maxLength={5} />
            <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="CVV" value={cvv} onChangeText={setCvv} secureTextEntry keyboardType="numeric" />
          </View>
          <TextInput style={styles.input} placeholder="Amount (₦)" value={amount} onChangeText={setAmount} keyboardType="numeric" />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <TouchableOpacity disabled={funding} onPress={handleFundWallet} style={styles.cta}>
            {funding ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Fund Wallet</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Referral Bonus</Text>
          <Text style={styles.sectionText}>Redeem a referral code to add a bonus to your wallet.</Text>
          <TextInput
            style={styles.input}
            placeholder="Referral Code"
            placeholderTextColor={COLORS.muted}
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
          />
          {referralMessage ? <Text style={styles.message}>{referralMessage}</Text> : null}
          <TouchableOpacity disabled={referralLoading} onPress={handleRedeemReferral} style={styles.cta}>
            {referralLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Redeem Code</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}
          {!loading && transactions.length === 0 ? <Text style={styles.empty}>No wallet transactions yet.</Text> : null}
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View>
                <Text style={styles.txLabel}>{tx.label}</Text>
                <Text style={styles.txMeta}>{tx.type}</Text>
              </View>
              <Text style={[styles.txAmount, tx.amount < 0 ? styles.negative : styles.positive]}>
                {tx.amount < 0 ? "-" : "+"}₦{Math.abs(Number(tx.amount || 0)).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.push("/checkout")} style={styles.secondaryCta}>
          <Text style={styles.secondaryCtaText}>Go To Checkout</Text>
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
  balanceCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
  },
  balanceLabel: { color: COLORS.muted, fontSize: 13 },
  balanceValue: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 32, fontWeight: "700", marginTop: 6 },
  pendingValue: { color: COLORS.muted, marginTop: 4 },
  tokenRow: { borderTopColor: COLORS.borderGray, borderTopWidth: 1, marginTop: 12, paddingTop: 10 },
  tokenLabel: { color: COLORS.muted, fontSize: 11, marginBottom: 4 },
  tokenValue: { color: COLORS.text, fontFamily: "monospace", fontSize: 11 },
  formCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontFamily: "Syne_700Bold", fontWeight: "700" },
  sectionText: { color: COLORS.muted, marginTop: 6, marginBottom: 12, lineHeight: 18 },
  input: {
    backgroundColor: "#fff",
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowInputs: { flexDirection: "row", marginTop: 10 },
  message: { color: COLORS.primary, marginTop: 10 },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 12, paddingVertical: 12 },
  ctaText: { color: "#fff", fontWeight: "700" },
  empty: { color: COLORS.muted, marginTop: 12 },
  txRow: {
    alignItems: "center",
    borderTopColor: COLORS.borderGray,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  txLabel: { color: COLORS.text, fontWeight: "700" },
  txMeta: { color: COLORS.muted, marginTop: 2, fontSize: 12 },
  txAmount: { fontWeight: "700" },
  positive: { color: "#0B7A4B" },
  negative: { color: "#B00020" },
  secondaryCta: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 12,
  },
  secondaryCtaText: { color: COLORS.primary, fontWeight: "700" },
});
