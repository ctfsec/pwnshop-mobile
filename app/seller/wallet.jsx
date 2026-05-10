import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { getSession } from "../../storage/insecure";
import { getSellerWallet, withdrawSellerWallet } from "../../api/seller";

function money(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function SellerWalletScreen() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState("");
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");

  async function loadWallet(nextSellerId) {
    setLoading(true);
    try {
      const response = await getSellerWallet({ sellerId: nextSellerId });
      setWallet(response.data?.wallet || null);
      setTransactions(response.data?.transactions || []);
    } catch (error) {
      setMessage(error.message || "Unable to load seller wallet");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (!mounted) return;
      const nextSellerId = user?.sellerId || user?.id || "s1";
      setSellerId(nextSellerId);
      loadWallet(nextSellerId);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleWithdraw() {
    setMessage("");
    setWithdrawing(true);
    try {
      await withdrawSellerWallet({
        sellerId,
        vulnBankAccount: accountNumber,
        amount: Number(amount || 0),
      });
      setMessage(`Withdrew ${money(amount)} to VulnBank.`);
      await loadWallet(sellerId);
    } catch (error) {
      setMessage(error.message || "Unable to withdraw funds");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Seller Wallet</Text>
        <Text style={styles.subtitle}>Withdraw available earnings to VulnBank.</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available</Text>
        <Text style={styles.balanceValue}>{money(wallet?.available)}</Text>
        <Text style={styles.balanceMeta}>Pending: {money(wallet?.pending)}</Text>
        <Text style={styles.balanceMeta}>Gross Sales: {money(wallet?.grossSales)}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Withdraw to VulnBank</Text>
        <Text style={styles.sectionText}>Enter the destination VulnBank account number and the amount to withdraw.</Text>
        <TextInput style={styles.input} placeholder="VulnBank Account Number" placeholderTextColor={COLORS.muted} value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Amount (₦)" placeholderTextColor={COLORS.muted} value={amount} onChangeText={setAmount} keyboardType="numeric" />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <TouchableOpacity disabled={withdrawing} onPress={handleWithdraw} style={styles.cta}>
          {withdrawing ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Withdraw</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.sectionTitle}>Wallet Transactions</Text>
        {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}
        {transactions.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={styles.txLeft}>
              <Text style={styles.txLabel} numberOfLines={2}>{tx.label}</Text>
              <Text style={styles.txMeta}>{tx.type}</Text>
            </View>
            <Text style={[styles.txAmount, tx.amount < 0 ? styles.negative : styles.positive]}>
              {tx.amount < 0 ? "-" : "+"}{money(Math.abs(Number(tx.amount || 0)))}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={() => router.push("/seller/products")} style={styles.secondaryCta}>
        <Text style={styles.secondaryCtaText}>Manage Products</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingBottom: 30, paddingTop: 54 },
  header: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
  },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.85)", marginTop: 6 },
  balanceCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  balanceLabel: { color: COLORS.muted, fontSize: 12 },
  balanceValue: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 30, marginTop: 6 },
  balanceMeta: { color: COLORS.muted, marginTop: 4 },
  formCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  sectionTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 18 },
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
  message: { color: COLORS.primary, marginTop: 10 },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 12, paddingVertical: 12 },
  ctaText: { color: "#fff", fontWeight: "700" },
  txRow: {
    alignItems: "center",
    borderTopColor: COLORS.borderGray,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 8,
  },
  txLeft: { flex: 1, flexShrink: 1 },
  txLabel: { color: COLORS.text, fontWeight: "700" },
  txMeta: { color: COLORS.muted, marginTop: 2, fontSize: 12 },
  txAmount: { fontWeight: "700", flexShrink: 0 },
  positive: { color: "#0B7A4B" },
  negative: { color: "#B00020" },
  secondaryCta: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 12,
  },
  secondaryCtaText: { color: COLORS.primary, fontWeight: "700" },
});
