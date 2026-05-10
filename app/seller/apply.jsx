import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { getSession, saveSession } from "../../storage/insecure";
import { CONFIG } from "../../api/config";

function msToCountdown(ms) {
  if (ms <= 0) return "any moment now";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function SellerApplyScreen() {
  const router = useRouter();
  const [step, setStep] = useState("loading");
  const [application, setApplication] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const pollRef = useRef(null);
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
          setStep("pending");
          const remaining = (json.data.application.approvalScheduledFor || 0) - Date.now();
          setCountdown(Math.max(0, remaining));
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

    pollRef.current = setInterval(async () => {
      const { user } = await getSession();
      if (!user) return;
      try {
        const res = await fetch(`${CONFIG.BASE_URL}/api/seller/status?userId=${user.id}`);
        const json = await res.json();
        if (json.data?.role === "seller") {
          await saveSession({ user: json.data.user });
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setStep("approved");
        }
      } catch {}
    }, 15000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, [step]);

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
            <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.cta}>
              <Text style={styles.ctaText}>Go to Seller Dashboard</Text>
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
            <Text style={styles.successSub}>Your seller account is now active. You can start listing products.</Text>
            <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.cta}>
              <Text style={styles.ctaText}>Go to Seller Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (step === "pending") {
    return (
      <View style={styles.page}>
        <Header router={router} />
        <View style={styles.body}>
          <View style={styles.pendingCard}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.pendingTitle}>Application Under Review</Text>
            <Text style={styles.pendingStore}>"{application?.storeName}"</Text>
            <Text style={styles.pendingText}>
              Our admin team is reviewing your application. You will be automatically approved.
            </Text>
            <View style={styles.countdownBox}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.countdownText}>
                Estimated approval in: <Text style={styles.countdownValue}>{msToCountdown(countdown)}</Text>
              </Text>
            </View>
            <Text style={styles.pendingHint}>This screen will update automatically when approved.</Text>
          </View>
        </View>
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
            Join thousands of sellers reaching millions of buyers across Nigeria. Applications are reviewed within 2 minutes.
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

  pendingCard: { alignItems: "center", backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 14, borderWidth: 1, padding: 28 },
  pendingTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 20, fontWeight: "700", marginTop: 16 },
  pendingStore: { color: COLORS.primary, fontSize: 16, fontWeight: "600", marginTop: 4 },
  pendingText: { color: COLORS.muted, lineHeight: 20, marginTop: 10, textAlign: "center" },
  countdownBox: { alignItems: "center", backgroundColor: COLORS.primary + "12", borderRadius: 10, flexDirection: "row", gap: 8, marginTop: 16, padding: 12 },
  countdownText: { color: COLORS.text, fontSize: 14 },
  countdownValue: { color: COLORS.primary, fontWeight: "700" },
  pendingHint: { color: COLORS.muted, fontSize: 12, marginTop: 12, textAlign: "center" },

  copy: { color: COLORS.text, lineHeight: 22 },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14 },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
