import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { getSession } from "../../storage/insecure";
import { getSellerProfile, updateSellerProfile } from "../../api/seller";

export default function SellerProfileScreen() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (!mounted) return;
      const sid = user?.sellerId || user?.id;
      setSellerId(sid);
      getSellerProfile({ sellerId: sid })
        .then((res) => {
          if (!mounted) return;
          const p = res.data || {};
          setName(p.name || "");
          setDescription(p.description || "");
          setContactPhone(p.contactPhone || "");
          setContactAddress(p.contactAddress || "");
          setLogo(p.logo || "");
        })
        .catch((e) => { if (mounted) setMessage(e.message || "Unable to load profile"); })
        .finally(() => { if (mounted) setLoading(false); });
    });
    return () => { mounted = false; };
  }, []);

  async function handleSave() {
    if (!name.trim()) { setMessage("Store name is required"); return; }
    setSaving(true);
    setMessage("");
    try {
      await updateSellerProfile({ sellerId, name: name.trim(), description, contactPhone, contactAddress, logo });
      setMessage("Profile saved successfully.");
    } catch (e) {
      setMessage(e.message || "Unable to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Seller Profile</Text>
      </View>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          {logo ? (
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          ) : (
            <Ionicons name="storefront-outline" size={36} color={COLORS.primary} />
          )}
        </View>
        <Text style={styles.avatarHint}>Your store info is visible to buyers on your seller page.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Store Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="My Store" placeholderTextColor={COLORS.muted} />

        <Text style={styles.label}>Store Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you sell..."
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Contact Phone</Text>
        <TextInput
          style={styles.input}
          value={contactPhone}
          onChangeText={setContactPhone}
          placeholder="+234 800 000 0000"
          placeholderTextColor={COLORS.muted}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Contact Address</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={contactAddress}
          onChangeText={setContactAddress}
          placeholder="Store pickup address (optional)"
          placeholderTextColor={COLORS.muted}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Logo URL (optional)</Text>
        <TextInput style={styles.input} value={logo} onChangeText={setLogo} placeholder="https://..." placeholderTextColor={COLORS.muted} autoCapitalize="none" />
      </View>

      {message ? <Text style={[styles.feedback, message.includes("success") && styles.feedbackOk]}>{message}</Text> : null}

      <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : (
          <View style={styles.saveBtnInner}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 40 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  header: { alignItems: "center", backgroundColor: COLORS.primary, flexDirection: "row", gap: 10, paddingBottom: 14, paddingHorizontal: 16, paddingTop: 54 },
  back: { padding: 2 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 20, fontWeight: "700" },
  avatarWrap: { alignItems: "center", paddingTop: 24, paddingBottom: 8 },
  avatar: { alignItems: "center", backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 50, borderWidth: 1, height: 80, justifyContent: "center", width: 80 },
  avatarText: { color: COLORS.primary, fontSize: 36, fontWeight: "700" },
  avatarHint: { color: COLORS.muted, fontSize: 12, marginTop: 10, textAlign: "center", paddingHorizontal: 40, lineHeight: 17 },
  form: { paddingHorizontal: 16, marginTop: 8 },
  label: { color: COLORS.muted, fontSize: 12, marginTop: 14 },
  input: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, color: COLORS.text, fontSize: 14, marginTop: 4, paddingHorizontal: 14, paddingVertical: 12 },
  multiline: { height: 90, textAlignVertical: "top" },
  feedback: { color: "#B00020", fontWeight: "600", marginTop: 12, marginHorizontal: 16 },
  feedbackOk: { color: "#0B7A4B" },
  saveBtn: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 10, marginHorizontal: 16, marginTop: 20, paddingVertical: 14 },
  saveBtnInner: { alignItems: "center", flexDirection: "row", gap: 8 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
