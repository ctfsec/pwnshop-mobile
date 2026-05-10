import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { forgotPassword, resetPassword } from "../../api/auth";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [revealedOtp, setRevealedOtp] = useState("");

  async function handleSendCode() {
    if (!email.trim()) {
      setIsError(true);
      setMessage("Please enter your email address.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await forgotPassword({ email: email.trim() });
      if (!res.ok) {
        setIsError(true);
        setMessage(res.error || "Could not send reset code.");
        return;
      }
      setIsError(false);
      setMessage("A reset code has been sent to your email.");
      setRevealedOtp(res.otp || "");
      setStep("otp");
    } catch (e) {
      setIsError(true);
      setMessage(e.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!otp.trim() || !newPassword.trim()) {
      setIsError(true);
      setMessage("Please enter the reset code and a new password.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await resetPassword({ email: email.trim(), otp: otp.trim(), newPassword: newPassword.trim() });
      if (!res.ok) {
        setIsError(true);
        setMessage(res.error || "Reset failed. Check your code and try again.");
        return;
      }
      setIsError(false);
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => router.replace("/(auth)/login"), 1500);
    } catch (e) {
      setIsError(true);
      setMessage(e.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Ionicons name="key" size={34} color="#fff" />
        </View>
        <Text style={styles.brand}>Reset Password</Text>
        <Text style={styles.tagline}>
          {step === "email" ? "Enter your email to receive a reset code" : "Enter the code sent to your email"}
        </Text>
      </View>

      <View style={styles.formCard}>
        {step === "email" ? (
          <>
            <Text style={styles.formTitle}>Forgot Password</Text>

            <View style={styles.fieldWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Email address"
                placeholderTextColor={COLORS.muted}
                returnKeyType="send"
                onSubmitEditing={handleSendCode}
              />
            </View>

            {message ? (
              <View style={[styles.msgBubble, isError ? styles.errBubble : styles.okBubble]}>
                <Ionicons
                  name={isError ? "alert-circle-outline" : "checkmark-circle-outline"}
                  size={16}
                  color={isError ? "#B00020" : "#1a7f37"}
                />
                <Text style={[styles.msgText, { color: isError ? "#B00020" : "#1a7f37" }]}>{message}</Text>
              </View>
            ) : null}

            <TouchableOpacity disabled={loading} onPress={handleSendCode} style={styles.cta}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Send Reset Code</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.formTitle}>Enter Reset Code</Text>
            <Text style={styles.stepHint}>Code sent to {email}</Text>
{/* OTP intentionally stored in state — visible in API response (PWN-M006) */}

            <View style={styles.fieldWrap}>
              <Ionicons name="keypad-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="4-digit code"
                placeholderTextColor={COLORS.muted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor={COLORS.muted}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            {message ? (
              <View style={[styles.msgBubble, isError ? styles.errBubble : styles.okBubble]}>
                <Ionicons
                  name={isError ? "alert-circle-outline" : "checkmark-circle-outline"}
                  size={16}
                  color={isError ? "#B00020" : "#1a7f37"}
                />
                <Text style={[styles.msgText, { color: isError ? "#B00020" : "#1a7f37" }]}>{message}</Text>
              </View>
            ) : null}

            <TouchableOpacity disabled={loading} onPress={handleResetPassword} style={styles.cta}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Reset Password</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep("email"); setMessage(""); }} style={styles.backLink}>
              <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
              <Text style={styles.backText}>Change Email</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
          <Text style={styles.backText}>Back to Login</Text>
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
  tagline: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 6, textAlign: "center", paddingHorizontal: 24 },
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
  stepHint: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 16,
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
  msgBubble: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    padding: 10,
  },
  errBubble: { backgroundColor: "#FFF5F5", borderColor: "#B00020" },
  okBubble: { backgroundColor: "#f0fdf4", borderColor: "#1a7f37" },
  msgText: { flex: 1, fontSize: 13 },
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
  otpReveal: {
    alignItems: "center",
    backgroundColor: "#fff8e1",
    borderColor: "#f59e0b",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  otpRevealLabel: { color: "#92400e", fontSize: 11, fontWeight: "600", marginBottom: 4 },
  otpRevealCode: { color: "#92400e", fontFamily: "Syne_700Bold", fontSize: 28, fontWeight: "700", letterSpacing: 8 },
});
