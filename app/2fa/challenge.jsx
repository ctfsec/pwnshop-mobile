import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { saveSession } from "../../storage/insecure";
import { CONFIG } from "../../api/config";

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
        <View style={styles.card}>
          <Ionicons name="lock-closed" size={48} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Enter your authenticator code</Text>
          <Text style={styles.cardText}>
            Open your authenticator app and enter the 6-digit code for PwnShop.
          </Text>
        </View>

        <TextInput
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor={COLORS.muted}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(v) => { setCode(v); setError(""); }}
          autoFocus
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleVerify}
          style={[styles.cta, code.length !== 6 && styles.ctaDisabled]}
          disabled={loading || code.length !== 6}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Verify</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.cancel}>
          <Text style={styles.cancelText}>Back to Login</Text>
        </TouchableOpacity>
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
  body: { flex: 1, padding: 24, justifyContent: "center" },
  card: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 28,
    padding: 24,
  },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginTop: 14, marginBottom: 8 },
  cardText: { color: COLORS.muted, lineHeight: 20, textAlign: "center" },
  codeInput: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 32,
    letterSpacing: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: "center",
  },
  errorText: { color: "#B00020", fontWeight: "600", marginTop: 12, textAlign: "center" },
  cta: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    marginTop: 20,
    paddingVertical: 14,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancel: { alignItems: "center", marginTop: 16, paddingVertical: 10 },
  cancelText: { color: COLORS.muted, fontWeight: "600" },
});
