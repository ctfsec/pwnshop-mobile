import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { getSession, saveSession } from "../../storage/insecure";
import { CONFIG } from "../../api/config";

function msToCountdown(ms) {
  if (ms <= 0) return "any moment now";
  const s = Math.ceil(ms / 1000);
  return `${s}s`;
}

export default function SellerApplyScreen() {
  const router = useRouter();
  const [step, setStep] = useState("loading");
  const [application, setApplication] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      const { user } = await getSession();
      if (!user) { if (mounted) setStep("unauthenticated"); return; }
      if (user.role === "seller" || user.role === "admin") { if (mounted) setStep("already_seller"); return; }

      try {
        const res = await fetch(`${CONFIG.BASE_URL}/api/seller/status?userId=${user.id}`);
        const json = await res.json();
        if (!mounted) return;
        if (json.data?.role === "seller") {
          await saveSession({ user: json.data.user });
          setStep("approved");
          return;
        }
        if (json.data?.application?.status === "pending") {
          setApplication(json.data.application);
          const remaining = (json.data.application.approvalScheduledFor || 0) - Date.now();
          setCountdown(Math.max(0, remaining));
          setStep("pending");
        } else {
          setStep("intro");
        }
      } catch {
        if (mounted) setStep("intro");
      }
    }

    checkStatus();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (step !== "pending") return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [step]);

  async function handleCheckStatus() {
    setChecking(true);
    setCheckMsg("");
    try {
      const { user } = await getSession();
      if (!user) return;
      const res = await fetch(`${CONFIG.BASE_URL}/api/seller/status?userId=${user.id}`);
      const json = await res.json();
      if (json.data?.role === "seller") {
        await saveSession({ user: json.data.user });
        setStep("approved");
      } else {
        setCheckMsg("Your application is still under review. Please check back shortly.");
      }
    } catch {
      setCheckMsg("Unable to check status. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (step === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (step === "already_seller") {
    return (
      <View style={styles.page}>
        <Header router={router} />
        <View style={styles.body}>
          <View style={styles.successCard}>
            <Ionicons name="storefront" size={52} color="#0B7A4B" />
            <Text style={styles.successTitle}>You're a seller</Text>
            <Text style={styles.successSub}>Your seller account is already active.</Text>
            <TouchableOpacity onPress={() => router.replace("/(tabs)/seller")} style={styles.dashboardBtn}>
              <Ionicons name="storefront-outline" size={18} color="#fff" />
              <Text style={styles.dashboardBtnText}>Go to Seller Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (step === "approved") {
    return (
      <View style={styles.page}>
        <Header router={router} />
        <View style={styles.body}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={64} color="#0B7A4B" />
            <Text style={styles.successTitle}>Application Approved!</Text>
            <Text style={styles.successSub}>
              Your seller account for "{application?.storeName}" is now active. You can start listing products.
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(tabs)/seller")} style={styles.dashboardBtn}>
              <Ionicons name="storefront-outline" size={18} color="#fff" />
              <Text style={styles.dashboardBtnText}>Go to Seller Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (step === "pending") {
    const submittedAt = application?.createdAt
      ? new Date(application.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;

    return (
      <View style={styles.page}>
        <Header router={router} />
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.submittedCard}>
            <View style={styles.submittedIconWrap}>
              <Ionicons name="paper-plane" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.submittedTitle}>Application Submitted!</Text>
            <Text style={styles.submittedSub}>
              Your seller application has been received and is being reviewed by our team.
            </Text>

            <View style={styles.detailBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Store Name</Text>
                <Text style={styles.detailValue}>{application?.storeName || "—"}</Text>
              </View>
              {submittedAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted At</Text>
                  <Text style={styles.detailValue}>{submittedAt}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Under Review</Text>
                </View>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Auto-approval in</Text>
                <Text style={[styles.detailValue, { color: countdown > 0 ? COLORS.primary : "#0B7A4B" }]}>
                  {countdown > 0 ? msToCountdown(countdown) : "Ready - tap Check below"}
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Applications are typically approved within 30 seconds. Tap the button below to check your status.
              </Text>
            </View>
          </View>

          {checkMsg ? (
            <View style={styles.checkMsgBox}>
              <Ionicons name="time-outline" size={16} color={COLORS.muted} />
              <Text style={styles.checkMsgText}>{checkMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.checkBtn, checking && styles.checkBtnDisabled]}
            onPress={handleCheckStatus}
            disabled={checking}
          >
            {checking
              ? <ActivityIndicator color="#fff" size="small" />
              : (
                <View style={styles.checkBtnInner}>
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                  <Text style={styles.checkBtnText}>Check Approval Status</Text>
                </View>
              )
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (step === "unauthenticated") {
    return (
      <View style={styles.page}>
        <Header router={router} />
        <View style={styles.body}>
          <Text style={styles.copy}>Please login to apply as a seller.</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.cta}>
            <Text style={styles.ctaText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Header router={router} />
      <View style={styles.body}>
        <View style={styles.introCard}>
          <Ionicons name="storefront-outline" size={52} color={COLORS.primary} />
          <Text style={styles.introTitle}>Sell on Pwnshop</Text>
          <Text style={styles.introCopy}>
            Join thousands of sellers reaching millions of buyers across Nigeria. Applications are reviewed within seconds.
          </Text>

          <View style={styles.benefitList}>
            {["Zero setup fee", "Commission-based earnings", "Dedicated seller dashboard", "VulnBank withdrawal support"].map((b) => (
              <View key={b} style={styles.benefit}>
                <Ionicons name="checkmark-circle" size={16} color="#0B7A4B" />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push("/seller/form")} style={styles.cta}>
          <Text style={styles.ctaText}>Start Seller Application</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Header({ router }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons color="#fff" name="arrow-back" size={22} />
      </TouchableOpacity>
      <Text style={styles.title}>Sell on Pwnshop</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
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
  body: { flex: 1, padding: 16 },

  introCard: { alignItems: "center", backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 14, borderWidth: 1, marginBottom: 20, padding: 24 },
  introTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700", marginTop: 12 },
  introCopy: { color: COLORS.muted, lineHeight: 20, marginTop: 8, textAlign: "center" },
  benefitList: { alignSelf: "stretch", marginTop: 16 },
  benefit: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 8 },
  benefitText: { color: COLORS.text, fontSize: 14 },

  successCard: { alignItems: "center", backgroundColor: "#F0FBF5", borderColor: "#0B7A4B", borderRadius: 14, borderWidth: 1, padding: 28, marginBottom: 20 },
  successTitle: { color: "#0B7A4B", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700", marginTop: 14 },
  successSub: { color: "#2D6A4F", lineHeight: 20, marginTop: 8, textAlign: "center" },
  dashboardBtn: { alignItems: "center", alignSelf: "stretch", backgroundColor: "#0B7A4B", borderRadius: 10, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 20, paddingHorizontal: 16, paddingVertical: 14 },
  dashboardBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  submittedCard: { alignItems: "center", backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 14, borderWidth: 1, marginBottom: 16, padding: 24 },
  submittedIconWrap: { alignItems: "center", backgroundColor: COLORS.primary + "18", borderRadius: 50, height: 72, justifyContent: "center", width: 72 },
  submittedTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700", marginTop: 16 },
  submittedSub: { color: COLORS.muted, lineHeight: 20, marginTop: 8, textAlign: "center" },
  detailBox: { alignSelf: "stretch", backgroundColor: COLORS.background, borderRadius: 10, marginTop: 20, padding: 14 },
  detailRow: { alignItems: "center", borderBottomColor: COLORS.borderGray, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  detailLabel: { color: COLORS.muted, fontSize: 13 },
  detailValue: { color: COLORS.text, fontWeight: "600", fontSize: 13 },
  statusBadge: { backgroundColor: "#FEF3C7", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: "#92400E", fontSize: 12, fontWeight: "700" },
  infoBox: { alignItems: "flex-start", backgroundColor: COLORS.primary + "10", borderRadius: 10, flexDirection: "row", gap: 8, marginTop: 16, padding: 12 },
  infoText: { color: COLORS.text, flex: 1, fontSize: 13, lineHeight: 18 },
  checkMsgBox: { alignItems: "center", backgroundColor: COLORS.card, borderRadius: 10, flexDirection: "row", gap: 8, marginBottom: 12, padding: 12 },
  checkMsgText: { color: COLORS.muted, flex: 1, fontSize: 13 },
  checkBtn: { alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 10, marginBottom: 12, paddingVertical: 14 },
  checkBtnDisabled: { opacity: 0.6 },
  checkBtnInner: { alignItems: "center", flexDirection: "row", gap: 8 },
  checkBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  backLink: { alignItems: "center", paddingVertical: 12 },
  backLinkText: { color: COLORS.muted, fontSize: 14 },
  copy: { color: COLORS.text, lineHeight: 22 },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14 },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
