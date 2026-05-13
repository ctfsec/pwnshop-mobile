import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../constants/colors";
import { MEDIA } from "../../../constants/media";
import { login } from "../../../api/auth";
import { grantAdminAccess } from "../../../storage/insecure";

export default function AdminAccessScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || "").trim());
  }

  async function handleVerify() {
    if (!email.trim()) { setMessage("Email address is required"); return; }
    if (!isValidEmail(email)) { setMessage("Please enter a valid email address"); return; }
    if (!password) { setMessage("Password is required"); return; }
    setLoading(true);
    setMessage("");
    try {
      const response = await login({ email, password });
      const role = String(response?.user?.role || "").toLowerCase();
      if (role !== "admin") {
        setMessage("Credentials are valid but not admin-level.");
        return;
      }
      await grantAdminAccess(30);
      router.replace("/admin");
    } catch (error) {
      setMessage(error.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Ionicons name="shield-checkmark" size={38} color="#fff" />
        </View>
        <Text style={styles.brand}>PwnShop Admin</Text>
        <Text style={styles.tagline}>Secure control panel access</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Sign In</Text>

        <View style={styles.fieldWrap}>
          <Ionicons name="mail-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Admin email"
            placeholderTextColor={COLORS.muted}
          />
        </View>

        <View style={styles.fieldWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
            <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {message ? (
          <View style={styles.errorBubble}>
            <Ionicons name="alert-circle-outline" size={16} color="#B00020" />
            <Text style={styles.errorText}>{message}</Text>
          </View>
        ) : null}

        <TouchableOpacity disabled={loading} onPress={handleVerify} style={styles.cta}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Access Admin Panel</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
          <Text style={styles.backText}>Back to App</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  hero: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingBottom: 32,
    paddingTop: 72,
  },
  logoWrap: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
    height: 72,
    justifyContent: "center",
    marginBottom: 14,
    width: 72,
  },
  brand: {
    color: "#fff",
    fontFamily: "Syne_700Bold",
    fontSize: 26,
    fontWeight: "700",
  },
  tagline: { color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 6 },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    margin: 20,
    marginTop: -20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    color: COLORS.text,
    fontFamily: "Syne_700Bold",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  fieldWrap: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  fieldIcon: { marginRight: 8 },
  eyeBtn: { padding: 4 },
  input: {
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  errorBubble: {
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderColor: "#B00020",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    padding: 10,
  },
  errorText: { color: "#B00020", flex: 1, fontSize: 13 },
  cta: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    marginTop: 4,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 18,
  },
  backText: { color: COLORS.primary, fontWeight: "600" },
});
