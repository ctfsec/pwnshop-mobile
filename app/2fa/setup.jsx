import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { getSession, saveSession } from "../../storage/insecure";
import { CONFIG } from "../../api/config";

export default function TwoFASetupScreen() {
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [step, setStep] = React.useState("loading");
  const [loading, setLoading] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    getSession().then(({ user: u }) => {
      if (!mounted) return;
      setUser(u);
      if (u?.twoFAEnabled) {
        setStep("active");
      } else {
        setStep("intro");
      }
    });
    return () => (mounted = false);
  }, []);

  async function handleEnable() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${CONFIG.BASE_URL}/api/2fa/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Setup failed");
      setSecret(json.secret);
      setQrDataUrl(json.qrDataUrl);
      setStep("scan");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (code.length !== 6) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${CONFIG.BASE_URL}/api/2fa/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, token: code }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "Invalid code. Try again."); return; }
      const updatedUser = { ...user, twoFAEnabled: true };
      await saveSession({ user: updatedUser });
      setUser(updatedUser);
      setStep("success");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${CONFIG.BASE_URL}/api/2fa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to disable 2FA");
      const updatedUser = { ...user, twoFAEnabled: false };
      await saveSession({ user: updatedUser });
      setUser(updatedUser);
      setStep("intro");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user || step === "loading") {
    return (
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons color="#fff" name="arrow-back" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Two-Factor Auth</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Two-Factor Authentication</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>

        {/* ── Already enabled ── */}
        {step === "active" && (
          <>
            <View style={styles.activeCard}>
              <View style={styles.activeIconRow}>
                <View style={styles.activeIconWrap}>
                  <Ionicons name="shield-checkmark" size={32} color="#0B7A4B" />
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.activeTitle}>2FA is enabled on your account</Text>
              <Text style={styles.activeText}>
                Every login requires a 6-digit code from your authenticator app. Your account is protected.
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity onPress={handleDisable} style={styles.disableBtn} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#B00020" />
                : (
                  <View style={styles.disableBtnInner}>
                    <Ionicons name="shield-outline" size={18} color="#B00020" />
                    <Text style={styles.disableBtnText}>Disable 2FA</Text>
                  </View>
                )
              }
            </TouchableOpacity>
          </>
        )}

        {/* ── Not yet enabled ── */}
        {step === "intro" && (
          <>
            <View style={styles.card}>
              <Ionicons name="shield-outline" size={52} color={COLORS.muted} />
              <Text style={styles.cardTitle}>2FA is not enabled</Text>
              <Text style={styles.cardText}>
                Add an extra layer of security. Once enabled, every login will require a
                6-digit code from your authenticator app in addition to your password.
              </Text>
              <View style={styles.appsRow}>
                <Text style={styles.appsLabel}>Works with: </Text>
                <Text style={styles.appsText}>Google Authenticator · Authy · Microsoft Authenticator</Text>
              </View>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity onPress={handleEnable} style={styles.cta} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Enable 2FA</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── Scan QR ── */}
        {step === "scan" && (
          <>
            <Text style={styles.stepHeading}>Step 1: Scan this QR code</Text>
            <Text style={styles.stepSub}>Open your authenticator app and scan the code below.</Text>

            {qrDataUrl ? (
              <Image source={{ uri: qrDataUrl }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <ActivityIndicator style={{ marginVertical: 40 }} />
            )}

            <Text style={styles.stepHeading}>Or enter the key manually</Text>
            <View style={styles.secretBox}>
              <Text style={styles.secretText} selectable>{secret}</Text>
            </View>
            <Text style={styles.hint}>
              In your authenticator app choose "Enter a setup key", select Time-based, and paste the key above.
            </Text>

            <Text style={styles.stepHeading}>Step 2: Enter the 6-digit code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={COLORS.muted}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(v) => { setCode(v); setError(""); }}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              onPress={handleVerify}
              style={[styles.cta, code.length !== 6 && styles.ctaDisabled]}
              disabled={loading || code.length !== 6}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Verify & Activate</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <View style={styles.successWrap}>
            <Ionicons name="checkmark-circle" size={72} color="#0B7A4B" />
            <Text style={styles.successTitle}>2FA Activated!</Text>
            <Text style={styles.successSub}>
              Your account now requires a code from your authenticator app at every login.
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.cta}>
              <Text style={styles.ctaText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

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
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 20, fontWeight: "700" },
  body: { padding: 20, paddingBottom: 40 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },

  activeCard: {
    backgroundColor: "#F0FBF5",
    borderColor: "#0B7A4B",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    padding: 20,
  },
  activeIconRow: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 14 },
  activeIconWrap: {
    alignItems: "center",
    backgroundColor: "#D4EDDA",
    borderRadius: 10,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  activeBadge: {
    backgroundColor: "#0B7A4B",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  activeTitle: { color: "#0B7A4B", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  activeText: { color: "#2D6A4F", lineHeight: 20 },

  disableBtn: {
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    borderColor: "#B00020",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
  },
  disableBtnInner: { alignItems: "center", flexDirection: "row", gap: 8 },
  disableBtnText: { color: "#B00020", fontWeight: "700", fontSize: 14 },

  card: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    padding: 24,
  },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginTop: 14, marginBottom: 8 },
  cardText: { color: COLORS.muted, lineHeight: 20, textAlign: "center", marginBottom: 12 },
  appsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 4 },
  appsLabel: { color: COLORS.muted, fontSize: 12 },
  appsText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },

  stepHeading: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 15, fontWeight: "700", marginTop: 20, marginBottom: 6 },
  stepSub: { color: COLORS.muted, lineHeight: 18, marginBottom: 12 },
  qrImage: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 220,
    width: 220,
    marginVertical: 8,
  },
  secretBox: { backgroundColor: "#f0f0f5", borderRadius: 8, marginTop: 8, padding: 14 },
  secretText: { color: COLORS.text, fontFamily: "monospace", fontSize: 15, letterSpacing: 2, textAlign: "center" },
  hint: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 8 },
  codeInput: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 28,
    letterSpacing: 10,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: "center",
  },
  errorText: { color: "#B00020", fontWeight: "600", marginTop: 10, textAlign: "center" },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 10, marginTop: 20, paddingVertical: 14 },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  successWrap: { alignItems: "center", paddingTop: 40 },
  successTitle: { color: COLORS.text, fontSize: 24, fontWeight: "700", marginTop: 16, marginBottom: 10 },
  successSub: { color: COLORS.muted, lineHeight: 20, textAlign: "center", marginBottom: 30 },
});
