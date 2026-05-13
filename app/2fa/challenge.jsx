import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { saveSession } from "../../storage/insecure";
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

export default function TwoFAChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const userId = String(params.userId || "");
  const token = String(params.token || "");
  const userRaw = String(params.user || "{}");

  async function handleVerify() {
    if (code.length !== 6) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${CONFIG.BASE_URL}/api/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token: code }),
      });
      const json = await res.json();
      // PWN-M021: app reads `verified` from response body to decide whether to allow login.
      // No server-side session flag is set. Intercepting and flipping verified=false→true bypasses 2FA.
      if (json.verified) {
        const user = JSON.parse(userRaw);
        await saveSession({ token, user });
        router.replace("/(tabs)");
      } else {
        setError("Incorrect code. Try again.");
      }
    } catch (e) {
      setError("Unable to verify. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Two-Factor Auth</Text>
      </View>

      <View style={styles.body}>
        <Ionicons name="keypad-outline" size={52} color={COLORS.primary} style={{ marginBottom: 16 }} />
        <Text style={styles.label}>Enter the 6-digit code</Text>
        <Text style={styles.sub}>Open your authenticator app and enter the current code for PwnShop.</Text>

        <OtpInput
          value={code}
          onChange={(v) => { setCode(v); setError(""); }}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleVerify}
          style={[styles.cta, code.length !== 6 && styles.ctaDisabled]}
          disabled={loading || code.length !== 6}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Verify</Text>}
        </TouchableOpacity>

        <Text style={styles.hint}>
          The code refreshes every 30 seconds. Make sure your device clock is synced.
        </Text>
      </View>
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
  body: { alignItems: "center", padding: 24, paddingTop: 48 },
  label: { color: COLORS.text, fontSize: 20, fontWeight: "700", marginBottom: 10 },
  sub: { color: COLORS.muted, fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 4 },

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
  cta: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    marginTop: 20,
    paddingVertical: 14,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 24, textAlign: "center" },
});
