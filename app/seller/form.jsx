import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { COLORS } from "../../constants/colors";
import { applySellerApplication, updateSellerProfile } from "../../api/seller";
import { getSession } from "../../storage/insecure";
import { saveSession } from "../../storage/insecure";

function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function isValidPhone(val) {
  const digits = val.replace(/[^0-9]/g, "");
  if (val.startsWith("+")) return digits.length >= 7 && digits.length <= 15;
  if (val.startsWith("0")) return /^0[789][0-1][0-9]{8}$/.test(val);
  return digits.length >= 7 && digits.length <= 15;
}

function handlePhoneChange(text, setPhone) {
  setPhone(text.replace(/[^0-9+]/g, "").slice(0, 16));
}

export default function SellerForm() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (!mounted) return;
      setEmail(user?.email || "");
      if (user?.name) setStoreName(user.name);
    });
    return () => { mounted = false; };
  }, []);

  async function handleStart() {
    setMessage("");

    if (!storeName.trim()) { setMessage("Store name is required."); return; }
    if (!email.trim()) { setMessage("Email address is required."); return; }
    if (!isValidEmail(email)) { setMessage("Enter a valid email address."); return; }
    if (!phone.trim()) { setMessage("Phone number is required."); return; }
    if (!isValidPhone(phone.trim())) { setMessage("Enter a valid phone number (e.g. 08012345678 or +447911123456)."); return; }
    if (!address.trim()) { setMessage("Business address is required."); return; }

    setLoading(true);
    try {
      const response = await applySellerApplication({ storeName, email, phone, address });
      if (response?.data?.user) {
        const currentSession = await getSession();
        const updatedUser = response.data.user;
        await saveSession({ token: currentSession.token, user: { ...updatedUser, pendingContactAddress: address, pendingContactPhone: phone } });
        const sellerId = updatedUser.sellerId || updatedUser.id;
        if (sellerId && address.trim()) {
          await updateSellerProfile({ sellerId, contactAddress: address.trim() }).catch(() => {});
        }
      }
      router.replace("/seller/apply");
    } catch (error) {
      setMessage(error.message || "Unable to submit seller application");
    } finally {
      setLoading(false);
    }
  }

  const emailInvalid = email.length > 0 && !isValidEmail(email);
  const phoneInvalid = phone.length >= 10 && !isValidPhone(phone);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Seller Onboarding</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>Store Name</Text>
        <TextInput
          value={storeName}
          onChangeText={setStoreName}
          style={styles.input}
          placeholder="e.g. Ibrahim's Store"
          placeholderTextColor={COLORS.muted}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={[styles.input, emailInvalid && styles.inputError]}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="e.g. you@example.com"
          placeholderTextColor={COLORS.muted}
        />
        {emailInvalid && <Text style={styles.fieldError}>Enter a valid email address</Text>}

        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={(v) => handlePhoneChange(v, setPhone)}
          style={[styles.input, phoneInvalid && styles.inputError]}
          keyboardType="phone-pad"
          maxLength={16}
          placeholder="e.g. 08012345678 or +447911123456"
          placeholderTextColor={COLORS.muted}
        />
        {phoneInvalid && <Text style={styles.fieldError}>Invalid number - use local (08012345678) or international (+44...)</Text>}

        <Text style={styles.label}>Business Address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          style={[styles.input, styles.inputMultiline]}
          placeholder="e.g. 12 Broad Street, Lagos Island, Lagos"
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={3}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity onPress={handleStart} style={styles.cta} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Submit Seller Application</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: { alignItems: "center", backgroundColor: COLORS.primary, flexDirection: "row", gap: 10, paddingBottom: 14, paddingHorizontal: 16, paddingTop: 54 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700" },
  body: { padding: 16 },
  label: { color: COLORS.muted, marginTop: 12 },
  input: { borderColor: COLORS.borderGray, borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 6, backgroundColor: COLORS.card, color: COLORS.text },
  inputMultiline: { height: 80, textAlignVertical: "top" },
  inputError: { borderColor: "#B00020" },
  fieldError: { color: "#B00020", fontSize: 11, fontWeight: "600", marginTop: 3 },
  message: { color: "#B00020", fontWeight: "600", marginTop: 12, textAlign: "center" },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 16, paddingVertical: 12 },
  ctaText: { color: "#fff", fontWeight: "700" },
});
