import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../constants/colors";
import { getAdminSellers, updateAdminSeller, updateAdminSellerApplication } from "../../../api/admin";

function money(v) { return `₦${Number(v || 0).toLocaleString()}`; }

export default function AdminSellersScreen() {
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 20 : 0;
  const [data, setData] = useState({ sellers: [], applications: [] });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState({});
  const [creditAmounts, setCreditAmounts] = useState({});

  async function load() {
    try {
      const res = await getAdminSellers();
      setData(res.data || { sellers: [], applications: [] });
    } catch (e) {
      setMessage(e.message || "Unable to load sellers");
    }
  }

  useEffect(() => { load(); }, []);

  async function act(sellerId, payload, msg) {
    setBusy((b) => ({ ...b, [sellerId]: true }));
    setMessage("");
    try {
      await updateAdminSeller(sellerId, payload);
      await load();
      setMessage(msg);
    } catch (e) {
      setMessage(e.message || "Action failed");
    } finally {
      setBusy((b) => ({ ...b, [sellerId]: false }));
    }
  }

  async function actApplication(appId, status, msg) {
    setBusy((b) => ({ ...b, [appId]: true }));
    setMessage("");
    try {
      await updateAdminSellerApplication(appId, { status });
      await load();
      setMessage(msg);
    } catch (e) {
      setMessage(e.message || "Action failed");
    } finally {
      setBusy((b) => ({ ...b, [appId]: false }));
    }
  }

  async function creditEarnings(seller) {
    const amount = Number(creditAmounts[seller.id] || 0);
    if (!amount || amount <= 0) { setMessage("Enter an amount to credit"); return; }
    await act(seller.id, { walletTopUp: amount }, `Earnings +${money(amount)} credited to ${seller.name}`);
    setCreditAmounts((c) => ({ ...c, [seller.id]: "" }));
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 30 + bottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Seller Management</Text>
        <Text style={styles.subtitle}>Approve, verify, ban, and credit seller earnings.</Text>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Text style={styles.sectionTitle}>Seller Profiles</Text>
      {(data.sellers || []).length === 0 && (
        <Text style={styles.empty}>No approved sellers yet.</Text>
      )}
      {(data.sellers || []).map((seller) => (
        <View key={seller.id} style={[styles.card, seller.banned && styles.cardBanned]}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{seller.name}</Text>
              <Text style={styles.meta}>{seller.email}</Text>
            </View>
            <View style={styles.badges}>
              {seller.verified && <View style={styles.verifiedBadge}><Text style={styles.badgeText}>✓ VERIFIED</Text></View>}
              {seller.banned && <View style={styles.bannedBadge}><Text style={styles.badgeText}>BANNED</Text></View>}
            </View>
          </View>

          <Text style={styles.meta}>Status: <Text style={styles.bold}>{seller.status}</Text></Text>
          <Text style={styles.meta}>Seller ID: {seller.id}</Text>
          {seller.description ? <Text style={styles.meta}>"{seller.description}"</Text> : null}

          {/* Earnings wallet */}
          <View style={styles.walletCard}>
            <View style={styles.walletRow}>
              <View style={styles.walletItem}>
                <Text style={styles.walletLabel}>Available Earnings</Text>
                <Text style={[styles.walletValue, { color: "#0B7A4B" }]}>{money(seller.walletAvailable)}</Text>
              </View>
              <View style={styles.walletItem}>
                <Text style={styles.walletLabel}>Pending Earnings</Text>
                <Text style={[styles.walletValue, { color: "#B07800" }]}>{money(seller.walletPending)}</Text>
              </View>
            </View>

            <View style={styles.creditRow}>
              <TextInput
                style={styles.creditInput}
                placeholder="Credit amount (₦)"
                placeholderTextColor={COLORS.muted}
                keyboardType="number-pad"
                value={String(creditAmounts[seller.id] || "")}
                onChangeText={(v) => setCreditAmounts((c) => ({ ...c, [seller.id]: v }))}
              />
              <TouchableOpacity
                onPress={() => creditEarnings(seller)}
                style={styles.creditBtn}
                disabled={busy[seller.id]}
              >
                {busy[seller.id] ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Credit Earnings</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={() => act(seller.id, { status: "approved" }, `${seller.name} approved`)} style={styles.approveBtn} disabled={busy[seller.id]}>
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => act(seller.id, { status: "rejected" }, `${seller.name} rejected`)} style={styles.rejectBtn} disabled={busy[seller.id]}>
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={() => act(seller.id, { verified: !seller.verified }, seller.verified ? "Badge removed" : "Badge granted")}
              style={styles.verifyBtn}
              disabled={busy[seller.id]}
            >
              <Text style={styles.btnText}>{seller.verified ? "Remove Verified" : "Grant Verified"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => act(seller.id, { banned: !seller.banned }, seller.banned ? `${seller.name} unbanned` : `${seller.name} banned`)}
              style={[styles.banBtn, seller.banned && styles.unbanActive]}
              disabled={busy[seller.id]}
            >
              <Text style={styles.btnText}>{seller.banned ? "Unban Seller" : "Ban Seller"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Seller Applications</Text>
      {(data.applications || []).length === 0 && (
        <Text style={styles.empty}>No applications yet.</Text>
      )}
      {(data.applications || []).map((app) => (
        <View key={app.id} style={styles.card}>
          <Text style={styles.name}>{app.storeName || app.email}</Text>
          <Text style={styles.meta}>{app.email}</Text>
          <Text style={styles.meta}>Status: <Text style={styles.bold}>{app.status}</Text></Text>
          {app.reason ? <Text style={styles.meta}>Reason: {app.reason}</Text> : null}
          {app.status === "pending" && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={() => actApplication(app.id, "approved", `${app.storeName || app.email} approved`)}
                style={styles.approveBtn}
                disabled={busy[app.id]}
              >
                {busy[app.id] ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Approve</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => actApplication(app.id, "rejected", `${app.storeName || app.email} rejected`)}
                style={styles.rejectBtn}
                disabled={busy[app.id]}
              >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
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
  sectionTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 18, marginTop: 16, marginBottom: 4 },
  empty: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
  message: { color: COLORS.primary, fontWeight: "600", marginTop: 10 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 12 },
  cardBanned: { borderColor: "#B00020", backgroundColor: "#FFF5F5" },
  topRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  verifiedBadge: { backgroundColor: "#0B7A4B", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  bannedBadge: { backgroundColor: "#B00020", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  name: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
  meta: { color: COLORS.muted, marginTop: 3, fontSize: 13 },
  bold: { color: COLORS.text, fontWeight: "700" },

  walletCard: {
    backgroundColor: "#F0FBF5",
    borderColor: "#0B7A4B" + "44",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  walletRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  walletItem: { flex: 1 },
  walletLabel: { color: COLORS.muted, fontSize: 11, marginBottom: 2 },
  walletValue: { fontWeight: "700", fontSize: 16 },
  creditRow: { flexDirection: "row", gap: 8 },
  creditInput: { backgroundColor: "#fff", borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, flex: 1, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  creditBtn: { alignItems: "center", backgroundColor: "#0B7A4B", borderRadius: 8, justifyContent: "center", paddingHorizontal: 12 },

  btnRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  approveBtn: { alignItems: "center", backgroundColor: "#0B7A4B", borderRadius: 8, flex: 1, paddingVertical: 9 },
  rejectBtn: { alignItems: "center", backgroundColor: "#B00020", borderRadius: 8, flex: 1, paddingVertical: 9 },
  verifyBtn: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, flex: 1, paddingVertical: 9 },
  banBtn: { alignItems: "center", backgroundColor: "#B00020", borderRadius: 8, flex: 1, paddingVertical: 9 },
  unbanActive: { backgroundColor: "#0B7A4B" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
