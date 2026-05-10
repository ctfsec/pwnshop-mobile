import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import { applySellerApplication } from "../../api/seller";
import { getSession } from "../../storage/insecure";
import { saveSession } from "../../storage/insecure";

export default function SellerForm() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (!mounted) return;
      setEmail(user?.email || "");
      if (user?.name) {
        setStoreName(user.name);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleStart() {
    setMessage("");
    setLoading(true);

    try {
      const response = await applySellerApplication({
        storeName,
        email,
        phone,
      });
      if (response?.data?.user) {
        const currentSession = await getSession();
        await saveSession({ token: currentSession.token, user: response.data.user });
      }
      setMessage("Application submitted. We will review your seller request shortly.");
      router.replace("/profile");
    } catch (error) {
      setMessage(error.message || "Unable to submit seller application");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Seller Onboarding</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>Store Name</Text>
        <TextInput value={storeName} onChangeText={setStoreName} style={styles.input} />

        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Phone</Text>
        <TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity onPress={handleStart} style={styles.cta} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Submit Seller Application</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: { alignItems: "center", backgroundColor: COLORS.primary, flexDirection: "row", gap: 10, paddingBottom: 14, paddingHorizontal: 16, paddingTop: 54 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700" },
  body: { padding: 16 },
  label: { color: COLORS.muted, marginTop: 12 },
  input: { borderColor: COLORS.borderGray, borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 6, backgroundColor: COLORS.card },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, marginTop: 16, paddingVertical: 12 },
  ctaText: { color: "#fff", fontWeight: "700" },
});
