import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { clearSession, getSession } from "../../storage/insecure";

const QUICK_LINKS_BUYER = ["Wallet", "Track Orders", "Pending Items", "Profile", "Notifications", "Physical Stores"];
const QUICK_LINKS_SELLER = ["Wallet", "Track Orders", "Pending Items", "Profile", "Notifications", "Physical Stores"];
const CATEGORIES = [
  "Computers & Accessories",
  "Phones & Tablets",
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Kids & Toys",
  "Beauty & Health",
];

const ICON_MAP = {
  Wallet: "wallet",
  "Track Orders": "location",
  "Pending Items": "time",
  Profile: "person",
  Notifications: "notifications",
  "Physical Stores": "map",
};

const ROUTE_MAP = {
  Wallet: "/wallet",
  "Track Orders": "/orders/track",
  "Pending Items": "/orders/pending",
  Profile: "/profile",
  Notifications: "/notifications/settings",
  "Physical Stores": "/stores",
};

const CATEGORY_SLUG = {
  "Computers & Accessories": "computers",
  "Phones & Tablets": "phones",
  Electronics: "electronics",
  Fashion: "fashion",
  "Home & Kitchen": "home-kitchen",
  "Kids & Toys": "kids-toys",
  "Beauty & Health": "beauty-health",
};

export default function MoreTab() {
  const router = useRouter();
  const [role, setRole] = useState(undefined);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (!mounted) return;
      if (user) {
        setRole(user.role || "buyer");
        setUserName(user.name || user.email || "");
      } else {
        setRole(null);
      }
    });
    return () => { mounted = false; };
  }, []);

  async function handleLogout() {
    await clearSession();
    router.replace("/(auth)/login");
  }

  const isLoggedIn = role !== null && role !== undefined;
  const isSeller = role === "seller" || role === "admin";
  const isBuyer = role === "buyer";
  const quickLinks = QUICK_LINKS_BUYER;

  if (role === undefined) return null;

  return (
    <ScrollView style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>More</Text>
          {userName ? <Text style={styles.headerSub}>{userName}</Text> : null}
        </View>
        {isLoggedIn && (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons color="#fff" name="log-out-outline" size={18} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Auth state banners — exactly one of these renders */}
      {!isLoggedIn && (
        <View style={styles.authRow}>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.outlineBtn}>
            <Text style={styles.outlineText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.filledBtn}>
            <Text style={styles.filledText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}

      {isBuyer && (
        <View style={styles.becomeSellerCard}>
          <View style={styles.becomeSellerLeft}>
            <Ionicons name="storefront-outline" size={28} color={COLORS.accent} />
            <View style={styles.becomeSellerText}>
              <Text style={styles.becomeSellerTitle}>Sell on Pwnshop</Text>
              <Text style={styles.becomeSellerSub}>Reach millions of buyers across Nigeria.</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/seller/apply")} style={styles.becomeSellerBtn}>
            <Text style={styles.becomeSellerBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}

      {isSeller && (
        <View style={styles.sellerBanner}>
          <Text style={styles.sellerBannerTitle}>Seller Tools</Text>
          <Text style={styles.sellerBannerText}>Manage your listings and track your earnings.</Text>
          <TouchableOpacity onPress={() => router.push("/seller/apply")} style={styles.filledBtn}>
            <Text style={styles.filledText}>Open Seller Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Admin console — visible to everyone (intentional — PWN-M015) */}
      <View style={styles.adminBanner}>
        <Text style={styles.adminBannerTitle}>Admin Console</Text>
        <Text style={styles.adminBannerText}>Restricted area. Enter admin credentials to continue.</Text>
        <TouchableOpacity onPress={() => router.push("/admin/access")} style={styles.adminBtn}>
          <Text style={styles.adminBtnText}>Open Admin Panel</Text>
        </TouchableOpacity>
      </View>

      {/* Quick links grid */}
      <View style={styles.quickGrid}>
        {quickLinks.map((label) => (
          <TouchableOpacity
            key={label}
            onPress={() => router.push(ROUTE_MAP[label] || "/")}
            style={styles.quickCard}
          >
            <Ionicons color={COLORS.primary} name={ICON_MAP[label] || "cube"} size={18} />
            <Text style={styles.quickLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.listWrap}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => router.push(`/category/${CATEGORY_SLUG[item] || "browse-all"}`)}
            style={styles.listItem}
          >
            <Text style={styles.listText}>{item}</Text>
            <Ionicons color={COLORS.muted} name="chevron-forward" size={16} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => router.push("/vuln-index")} style={styles.vulnIndexBtn}>
        <View style={styles.vulnIndexLeft}>
          <Ionicons color="#B00020" name="bug-outline" size={20} />
          <View>
            <Text style={styles.vulnIndexTitle}>Vulnerability Index</Text>
            <Text style={styles.vulnIndexSub}>45 intentional vulnerabilities</Text>
          </View>
        </View>
        <Ionicons color={COLORS.muted} name="chevron-forward" size={16} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/chat")} style={styles.moreOptions}>
        <Ionicons color={COLORS.accent} name="help-circle" size={18} />
        <Text style={styles.moreText}>Help & Support</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 54,
  },
  heading: { color: "#fff", fontSize: 25, fontFamily: "Syne_700Bold", fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  logoutBtn: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  authRow: { columnGap: 10, flexDirection: "row", padding: 16 },

  becomeSellerCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.accent,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
  },
  becomeSellerLeft: { alignItems: "center", flexDirection: "row", gap: 12, flex: 1 },
  becomeSellerText: { flex: 1 },
  becomeSellerTitle: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
  becomeSellerSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  becomeSellerBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  becomeSellerBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  sellerBanner: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  sellerBannerTitle: { color: COLORS.text, fontSize: 18, fontFamily: "Syne_700Bold", fontWeight: "700" },
  sellerBannerText: { color: COLORS.muted, marginBottom: 12, marginTop: 6 },

  adminBanner: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  adminBannerTitle: { color: COLORS.text, fontSize: 18, fontFamily: "Syne_700Bold", fontWeight: "700" },
  adminBannerText: { color: COLORS.muted, marginBottom: 12, marginTop: 6 },
  adminBtn: { alignItems: "center", backgroundColor: "#1737AA", borderRadius: 6, paddingVertical: 12 },
  adminBtnText: { color: "#fff", fontWeight: "700" },

  outlineBtn: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.secondary,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  outlineText: { color: COLORS.primary, fontWeight: "700" },
  filledBtn: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    flex: 1,
    paddingVertical: 12,
  },
  filledText: { color: "#fff", fontWeight: "700" },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16, paddingHorizontal: 16 },
  quickCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 86,
    padding: 10,
    width: "47%",
  },
  quickLabel: { color: COLORS.text, fontSize: 12, fontWeight: "600", marginTop: 7, textAlign: "center" },

  sectionTitle: { color: COLORS.text, fontSize: 18, fontFamily: "Syne_700Bold", fontWeight: "700", marginTop: 18, paddingHorizontal: 16 },
  listWrap: { paddingHorizontal: 16, paddingTop: 8 },
  listItem: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  listText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  vulnIndexBtn: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: "#B00020" + "33",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  vulnIndexLeft: { alignItems: "center", flexDirection: "row", gap: 12 },
  vulnIndexTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  vulnIndexSub: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  moreOptions: { alignItems: "center", flexDirection: "row", marginBottom: 24, marginTop: 10, paddingHorizontal: 16 },
  moreText: { color: COLORS.primary, fontWeight: "700", marginLeft: 8 },
});
