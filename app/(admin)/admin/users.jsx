import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../constants/colors";
import { getAdminUsers, updateAdminUser } from "../../../api/admin";
import { getSession, saveSession } from "../../../storage/insecure";

const ROLES = ["buyer", "seller", "admin"];

function money(v) { return `₦${Number(v || 0).toLocaleString()}`; }

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [topUpAmounts, setTopUpAmounts] = useState({});
  const [busy, setBusy] = useState({});

  async function load() {
    try {
      const res = await getAdminUsers();
      setUsers(res.data || []);
    } catch (e) {
      setMessage(e.message || "Unable to load users");
    }
  }

  useEffect(() => { load(); }, []);

  async function act(userId, payload, successMsg) {
    setBusy((b) => ({ ...b, [userId]: true }));
    setMessage("");
    try {
      await updateAdminUser(userId, payload);
      await load();
      setMessage(successMsg);

      // If the changed user is the currently logged-in user, sync the local session
      // so the tab bar reflects the new role/banned state immediately on next focus.
      const { user: sessionUser, token } = await getSession();
      if (sessionUser && sessionUser.id === userId) {
        const sessionUpdates = {};
        if ("role" in payload) {
          sessionUpdates.role = payload.role;
          if (payload.role === "seller") sessionUpdates.sellerEnrollmentStatus = "approved";
          if (payload.role === "buyer") sessionUpdates.sellerEnrollmentStatus = "unapproved";
        }
        if ("banned" in payload) sessionUpdates.banned = payload.banned;
        if (Object.keys(sessionUpdates).length > 0) {
          await saveSession({ token, user: { ...sessionUser, ...sessionUpdates } });
        }
      }
    } catch (e) {
      setMessage(e.message || "Action failed");
    } finally {
      setBusy((b) => ({ ...b, [userId]: false }));
    }
  }

  async function cycleRole(user) {
    const next = ROLES[(ROLES.indexOf(user.role) + 1) % ROLES.length];
    await act(user.id, { role: next }, `${user.email} role changed to ${next}`);
  }

  async function toggleBan(user) {
    await act(user.id, { banned: !user.banned }, user.banned ? `${user.email} unbanned` : `${user.email} banned`);
  }

  async function topUpShoppingWallet(user) {
    const amount = Number(topUpAmounts[user.id] || 0);
    if (!amount || amount <= 0) { setMessage("Enter an amount"); return; }
    await act(user.id, { walletTopUp: amount }, `Shopping wallet +${money(amount)} credited to ${user.email}`);
    setTopUpAmounts((t) => ({ ...t, [user.id]: "" }));
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>Roles, bans, and shopping wallet top-ups.</Text>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {users.map((user) => {
        const isSeller = user.role === "seller" || user.role === "admin";
        return (
          <View key={user.id} style={[styles.card, user.banned && styles.cardBanned]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user.name || "(no name)"}</Text>
                <Text style={styles.meta}>{user.email}</Text>
              </View>
              <View style={styles.badges}>
                {user.banned && <View style={styles.bannedBadge}><Text style={styles.badgeText}>BANNED</Text></View>}
                {isSeller && <View style={styles.sellerBadge}><Text style={styles.badgeText}>{user.role.toUpperCase()}</Text></View>}
              </View>
            </View>

            <Text style={styles.meta}>ID: {user.id}</Text>

            <View style={styles.walletRow}>
              <View style={styles.walletBox}>
                <Text style={styles.walletLabel}>🛒 Shopping</Text>
                <Text style={styles.walletValue}>{money(user.walletBalance)}</Text>
              </View>
              {isSeller && (
                <View style={[styles.walletBox, styles.walletBoxEarnings]}>
                  <Text style={styles.walletLabel}>💰 Earnings</Text>
                  <Text style={[styles.walletValue, { color: "#0B7A4B" }]}>{money(user.sellerWalletAvailable)}</Text>
                  {user.sellerWalletPending > 0 && (
                    <Text style={styles.walletPending}>{money(user.sellerWalletPending)} pending</Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => cycleRole(user)} style={styles.roleBtn} disabled={busy[user.id]}>
                {busy[user.id] ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Cycle Role</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleBan(user)}
                style={[styles.banBtn, user.banned && styles.unbanActive]}
                disabled={busy[user.id]}
              >
                <Text style={styles.btnText}>{user.banned ? "Unban" : "Ban"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.topUpRow}>
              <TextInput
                style={styles.topUpInput}
                placeholder="Amount (₦)"
                placeholderTextColor={COLORS.muted}
                keyboardType="number-pad"
                value={String(topUpAmounts[user.id] || "")}
                onChangeText={(v) => setTopUpAmounts((t) => ({ ...t, [user.id]: v }))}
              />
              <TouchableOpacity onPress={() => topUpShoppingWallet(user)} style={styles.topUpBtn} disabled={busy[user.id]}>
                <Text style={styles.btnText}>Top Up Shopping</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingBottom: 30, paddingTop: 54 },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 5 },
  message: { color: COLORS.primary, fontWeight: "600", marginTop: 10 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 12 },
  cardBanned: { borderColor: "#B00020", backgroundColor: "#FFF5F5" },
  row: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  badges: { flexDirection: "row", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" },
  bannedBadge: { backgroundColor: "#B00020", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  sellerBadge: { backgroundColor: COLORS.primary, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  name: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
  meta: { color: COLORS.muted, marginTop: 2, fontSize: 13 },
  walletRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  walletBox: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  walletBoxEarnings: { borderColor: "#0B7A4B" + "44" },
  walletLabel: { color: COLORS.muted, fontSize: 11, marginBottom: 3 },
  walletValue: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
  walletPending: { color: "#B07800", fontSize: 11, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  roleBtn: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, flex: 1, paddingVertical: 9 },
  banBtn: { alignItems: "center", backgroundColor: "#0B7A4B", borderRadius: 8, flex: 1, paddingVertical: 9 },
  unbanActive: { backgroundColor: "#B00020" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  topUpRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  topUpInput: { backgroundColor: "#fff", borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, flex: 1, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  topUpBtn: { alignItems: "center", backgroundColor: "#1737AA", borderRadius: 8, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 9 },
});
