import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import Wordmark from "../../components/ui/wordmark";
import { register as registerRequest } from "../../api/auth";
import { saveSession } from "../../storage/insecure";

const GENDERS = ["Male", "Female", "Other"];

function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || "").trim());
}

function isValidPhone(val) {
  const digits = val.replace(/[^0-9]/g, "");
  // International format: + followed by 7–15 digits (E.164)
  if (val.startsWith("+")) return digits.length >= 7 && digits.length <= 15;
  // Nigerian local format: 0XXXXXXXXXX (11 digits, prefix 07/08/09)
  if (val.startsWith("0")) return /^0[789][0-1][0-9]{8}$/.test(val);
  // Bare international digits without +: 7–15 digits
  return digits.length >= 7 && digits.length <= 15;
}

function isValidDob(val) {
  if (!val || val.length < 10) return false;
  const parts = val.split("/");
  if (parts.length !== 3) return false;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy) return false;
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  const currentYear = new Date().getFullYear();
  if (yyyy < 1900 || yyyy > currentYear) return false;
  return true;
}

function FieldLabel({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

export default function Register() {
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 20 : 0;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.replace("/(tabs)"), 2500);
    return () => clearTimeout(t);
  }, [success]);

  function handleDobChange(text) {
    const digits = text.replace(/[^0-9]/g, "");
    let formatted = digits;
    if (digits.length > 2 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    setDob(formatted);
  }

  function handlePhoneChange(text) {
    const digits = text.replace(/[^0-9+]/g, "");
    setPhone(digits);
  }

  async function handleRegister() {
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required");
      return;
    }
    if (/[^a-zA-Z\s'-]/.test(firstName) || /[^a-zA-Z\s'-]/.test(lastName)) {
      setError("Name should contain letters only");
      return;
    }
    if (!email.trim()) {
      setError("Email address is required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address (e.g. you@example.com)");
      return;
    }
    if (phone.trim() && !isValidPhone(phone.trim())) {
      setError("Enter a valid phone number (e.g. 08012345678 or +447911123456)");
      return;
    }
    if (dob.trim()) {
      if (dob.length < 10) {
        setError("Date of birth is incomplete — enter in DD/MM/YYYY format");
        return;
      }
      if (!isValidDob(dob)) {
        setError("Invalid date of birth — check day (01-31), month (01-12) and year");
        return;
      }
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await registerRequest({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password,
        phone: phone.trim(),
        dob: dob.trim(),
        gender,
        role: "buyer",
        referralCode: referralCode.trim(),
      });

      await saveSession({ token: response.token, user: response.user });
      setUserName(firstName.trim());
      setSuccess(true);
    } catch (authError) {
      setError(authError.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.successPage}>
        <View style={styles.successIcon}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Account Created!</Text>
        <Text style={styles.successSub}>Welcome to Pwnshop, {userName}. Taking you in...</Text>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView style={styles.page} contentContainerStyle={[styles.container, { paddingBottom: 40 + bottomPadding }]} keyboardShouldPersistTaps="handled">
      <Wordmark />
      <Text style={styles.title}>Create An Account</Text>

      <View style={styles.row}>
        <View style={styles.halfWrap}>
          <FieldLabel text="First Name" />
          <TextInput
            style={styles.input}
            placeholder="e.g. Ibrahim"
            placeholderTextColor={COLORS.muted}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.halfWrap}>
          <FieldLabel text="Last Name" />
          <TextInput
            style={styles.input}
            placeholder="e.g. Olajide"
            placeholderTextColor={COLORS.muted}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </View>
      </View>

      <FieldLabel text="Email Address" />
      <TextInput
        style={[styles.input, email.length > 4 && !isValidEmail(email) && styles.inputError]}
        placeholder="e.g. you@example.com"
        placeholderTextColor={COLORS.muted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="off"
      />
      {email.length > 4 && !isValidEmail(email) && (
        <Text style={styles.fieldError}>Enter a valid email address</Text>
      )}

      <FieldLabel text="Phone Number" />
      <TextInput
        style={[styles.input, phone.length >= 10 && !isValidPhone(phone) && styles.inputError]}
        placeholder="e.g. 08012345678"
        placeholderTextColor={COLORS.muted}
        value={phone}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        maxLength={16}
      />
      {phone.length >= 10 && !isValidPhone(phone) && (
        <Text style={styles.fieldError}>Invalid number - use local format (08012345678) or international (+44...)</Text>
      )}

      <FieldLabel text="Date of Birth" />
      <TextInput
        style={[styles.input, dob.length === 10 && !isValidDob(dob) && styles.inputError]}
        placeholder="DD/MM/YYYY"
        placeholderTextColor={COLORS.muted}
        value={dob}
        onChangeText={handleDobChange}
        keyboardType="number-pad"
        maxLength={10}
      />
      {dob.length === 10 && !isValidDob(dob) && (
        <Text style={styles.fieldError}>Invalid date — check day, month and year</Text>
      )}

      <FieldLabel text="Gender" />
      <View style={styles.genderRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => setGender(g)}
            style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
          >
            <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FieldLabel text="Referral Code (optional)" />
      <TextInput
        style={styles.input}
        placeholder="e.g. PWN-U1NG"
        placeholderTextColor={COLORS.muted}
        value={referralCode}
        onChangeText={setReferralCode}
        autoCapitalize="characters"
      />

      <FieldLabel text="Password" />
      <View style={styles.passwordWrap}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Minimum 6 characters"
          placeholderTextColor={COLORS.muted}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
          <Text style={styles.showHide}>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>

      <FieldLabel text="Confirm Password" />
      <TextInput
        style={styles.input}
        placeholder="Re-enter your password"
        placeholderTextColor={COLORS.muted}
        secureTextEntry={!showPassword}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.loginLink}>
        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginHighlight}>Login</Text></Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  successPage: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  successIcon: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    height: 80,
    justifyContent: "center",
    marginBottom: 24,
    width: 80,
  },
  successCheck: { color: "#fff", fontSize: 40, fontWeight: "700" },
  successTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 28, fontWeight: "700" },
  successSub: { color: COLORS.muted, fontSize: 15, marginTop: 8, textAlign: "center" },
  page: { backgroundColor: COLORS.background, flex: 1 },
  container: { padding: 24, paddingTop: 54 },
  title: {
    color: COLORS.text,
    fontFamily: "Syne_700Bold",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 10,
    textAlign: "center",
  },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "600", marginBottom: 4, marginTop: 10 },
  row: { flexDirection: "row", gap: 10 },
  halfWrap: { flex: 1 },
  input: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  genderRow: { flexDirection: "row", gap: 8, marginBottom: 2 },
  genderBtn: {
    alignItems: "center",
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  genderBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderText: { color: COLORS.muted, fontWeight: "600" },
  genderTextActive: { color: "#fff" },
  passwordWrap: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 2,
    paddingHorizontal: 12,
  },
  passwordInput: { color: COLORS.text, flex: 1, paddingVertical: 12 },
  showHide: { color: COLORS.accent, fontWeight: "700" },
  button: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 18,
    paddingVertical: 14,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: { color: "#B00020", marginBottom: 6, marginTop: 8, textAlign: "center" },
  loginLink: { alignItems: "center", marginTop: 16 },
  loginText: { color: COLORS.muted, fontSize: 14 },
  loginHighlight: { color: COLORS.primary, fontWeight: "700" },
  inputError: { borderColor: "#B00020" },
  fieldError: { color: "#B00020", fontSize: 11, marginBottom: 4, marginTop: 2 },
});
