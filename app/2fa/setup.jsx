import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { getSession, saveSession } from "../../storage/insecure";
import { CONFIG } from "../../api/config";

function OtpInput({ value, onChange }) {
  const inputRef = React.useRef(null);
  const digits = Array(6).fill("").map((_, i) => value[i] || "");
  const activeIndex = Math.min(value.length, 5);

  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        caretHidden
        style={styles.otpHiddenInput}
      />
      {digits.map((digit, i) => (
        <View
          key={i}
          style={[
            styles.otpBox,
            i === activeIndex && styles.otpBoxActive,
            digit ? styles.otpBoxFilled : null,
          ]}
        >
          {digit
            ? <Text style={styles.otpDigit}>{digit}</Text>
            : i === activeIndex
              ? <View style={styles.otpCursor} />
              : null}
        </View>
      ))}
    </TouchableOpacity>
  );
}

export default function TwoFASetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 52 : 0;
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
      setStep(u?.twoFAEnabled ? "active" : "intro");
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

  function goToVerify() {
    setCode("");
    setError("");
    setStep("verify");
  }

  const headerTitle =
    step === "scan" ? "Scan QR Code" :
    step === "verify" ? "Enter Code" :
    "Two-Factor Authentication";

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
        <TouchableOpacity onPress={step === "verify" ? () => setStep("scan") : () => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{headerTitle}</Text>
      </View>

      {/* ── Loading / intro / active / scan / success — scrollable ── */}
      {step !== "verify" && (
        <ScrollView contentContainerStyle={styles.body}>

          {/* Already enabled */}
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

          {/* Not yet enabled */}
          {step === "intro" && (
            <>
              <View style={styles.card}>
                <View style={styles.introIconRow}>
                  <View style={styles.introIconCircle}>
                    <View style={styles.introIconRing}>
                      <Ionicons name="lock-open-outline" size={34} color="#B07800" />
                    </View>
                  </View>
                  <View style={styles.introBadge}>
                    <View style={styles.introDot} />
                    <Text style={styles.introBadgeText}>NOT ENABLED</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>Protect your account</Text>
                <Text style={styles.cardText}>
                  Add an extra layer of security. Every login will require a 6-digit code from your authenticator app in addition to your password.
                </Text>

                <View style={styles.introDivider} />

                <Text style={styles.appsLabel}>Works with</Text>
                <View style={styles.appsChips}>
                  <View style={styles.appChip}>
                    <Ionicons name="logo-google" size={13} color={COLORS.primary} />
                    <Text style={styles.appChipText}>Google Authenticator</Text>
                  </View>
                  <View style={styles.appChip}>
                    <Ionicons name="logo-microsoft" size={13} color={COLORS.primary} />
                    <Text style={styles.appChipText}>Microsoft Authenticator</Text>
                  </View>
                </View>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity onPress={handleEnable} style={styles.cta} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Enable 2FA</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* Scan QR */}
          {step === "scan" && (
            <>
              <Text style={styles.stepSub}>Open your authenticator app and scan the QR code below, then tap Next.</Text>

              {qrDataUrl ? (
                <Image source={{ uri: qrDataUrl }} style={styles.qrImage} resizeMode="contain" />
              ) : (
                <ActivityIndicator style={{ marginVertical: 40 }} />
              )}

              <Text style={styles.stepHeading}>Can't scan? Enter the key manually</Text>
              <View style={styles.secretBox}>
                <Text style={styles.secretText} selectable>{secret}</Text>
              </View>
              <Text style={styles.hint}>
                In your authenticator app choose "Enter a setup key", select Time-based, and paste the key above.
              </Text>

              <TouchableOpacity onPress={goToVerify} style={styles.cta}>
                <Text style={styles.ctaText}>I've scanned it — Next</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Success */}
          {step === "success" && (
            <View style={styles.successWrap}>
              <Ionicons name="checkmark-circle" size={72} color="#0B7A4B" />
              <Text style={styles.successTitle}>2FA Activated!</Text>
              <Text style={styles.successSub}>
                Your account now requires a code from your authenticator app at every login.
              </Text>
              <TouchableOpacity onPress={() => router.back()} style={[styles.cta, styles.ctaStretch]}>
                <Text style={styles.ctaText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: bottomPadding }} />
        </ScrollView>
      )}

      {/* ── Verify step — simple fixed layout, no scroll, keyboard-safe ── */}
      {step === "verify" && (
        <View style={styles.verifyPage}>
          <Ionicons name="keypad-outline" size={52} color={COLORS.primary} style={{ marginBottom: 16 }} />
          <Text style={styles.verifyTitle}>Enter the 6-digit code</Text>
          <Text style={styles.verifySub}>Open your authenticator app and enter the current code for PwnShop.</Text>

          <OtpInput
            value={code}
            onChange={(v) => { setCode(v); setError(""); }}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleVerify}
            style={[styles.cta, styles.verifyBtn, code.length !== 6 && styles.ctaDisabled]}
            disabled={loading || code.length !== 6}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Verify & Activate</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep("scan")} style={styles.backLink}>
            <View style={{ alignItems: "center", flexDirection: "row", gap: 6 }}>
              <Ionicons name="arrow-back" size={14} color={COLORS.primary} />
              <Text style={styles.backLinkText}>Go back and rescan</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    padding: 20,
  },
  introIconRow: { alignItems: "center", flexDirection: "column", gap: 12, justifyContent: "center", marginBottom: 16 },
  introIconCircle: {
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    borderColor: "#F5C518",
    borderRadius: 999,
    borderWidth: 2,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  introIconRing: {
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderColor: "#B07800",
    borderRadius: 999,
    borderWidth: 1.5,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  introBadge: {
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    borderColor: "#B07800",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  introDot: {
    backgroundColor: "#B07800",
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  introBadgeText: { color: "#B07800", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  cardText: { color: COLORS.muted, lineHeight: 20, marginBottom: 4, textAlign: "center" },
  introDivider: { borderTopColor: COLORS.borderGray, borderTopWidth: 1, marginVertical: 14 },
  appsLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "600", marginBottom: 10, textAlign: "center" },
  appsChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  appChip: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderColor: COLORS.borderGray,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  appChipText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },

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
  secretText: { color: COLORS.text, fontFamily: "monospace", fontSize: 15, letterSpacing: 2, textAlign: "left" },
  hint: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 8 },

  verifyPage: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  verifyTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700", marginBottom: 10 },
  verifySub: { color: COLORS.muted, lineHeight: 20, textAlign: "center", marginBottom: 8 },
  verifyBtn: { alignSelf: "stretch" },

  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginTop: 24, marginBottom: 4 },
  otpHiddenInput: { height: 0, opacity: 0, position: "absolute", width: 0 },
  otpBox: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 56,
    justifyContent: "center",
    width: 44,
  },
  otpBoxActive: { borderColor: COLORS.primary, borderWidth: 2 },
  otpBoxFilled: { borderColor: COLORS.accent },
  otpDigit: { color: COLORS.text, fontSize: 22, fontWeight: "700" },
  otpCursor: {
    backgroundColor: COLORS.primary,
    borderRadius: 1,
    height: 22,
    width: 2,
  },

  errorText: { color: "#B00020", fontWeight: "600", marginTop: 10, textAlign: "center" },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 10, marginTop: 20, paddingVertical: 14 },
  ctaStretch: { alignSelf: "stretch" },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  backLink: { marginTop: 20 },
  backLinkText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },

  successWrap: { alignItems: "center", paddingTop: 40 },
  successTitle: { color: COLORS.text, fontSize: 24, fontWeight: "700", marginTop: 16, marginBottom: 10 },
  successSub: { color: COLORS.muted, lineHeight: 20, textAlign: "center", marginBottom: 30 },
});
