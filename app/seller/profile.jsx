import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../../constants/colors";
import { CONFIG } from "../../api/config";
import { getSession } from "../../storage/insecure";
import { getSellerProfile, updateSellerProfile } from "../../api/seller";

function isValidPhone(val) {
  const digits = val.replace(/[^0-9]/g, "");
  if (val.startsWith("+")) return digits.length >= 7 && digits.length <= 15;
  if (val.startsWith("0")) return /^0[789][0-1][0-9]{8}$/.test(val);
  return digits.length >= 7 && digits.length <= 15;
}

export default function SellerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sellerId, setSellerId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 45 : 0;

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
          setContactPhone(p.contactPhone || user?.pendingContactPhone || "");
          setContactAddress(p.contactAddress || user?.pendingContactAddress || "");
          setLogo(p.logo || "");
        })
        .catch((e) => { if (mounted) setMessage(e.message || "Unable to load profile"); })
        .finally(() => { if (mounted) setLoading(false); });
    });
    return () => { mounted = false; };
  }, []);

  async function handlePickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Photo access is required to pick a logo. You can paste a URL instead.");
      setShowUrlInput(true);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setLogo(asset.uri);
    setUploading(true);
    setMessage("");
    try {
      const fileName = asset.uri.split("/").pop() || "logo.jpg";
      const mimeType = asset.mimeType || "image/jpeg";
      const formData = new FormData();
      formData.append("image", { uri: asset.uri, name: fileName, type: mimeType });
      const res = await fetch(`${CONFIG.BASE_URL}/api/products/upload-image`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.url) {
        setLogo(`${CONFIG.BASE_URL}${json.url}`);
      } else {
        throw new Error("Upload failed");
      }
    } catch {
      setMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) { setMessage("Store name is required"); return; }
    if (contactPhone.trim() && !isValidPhone(contactPhone.trim())) {
      setMessage("Enter a valid phone number (e.g. 08012345678 or +447911123456)");
      return;
    }
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
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Seller Profile</Text>
        </View>

        {/* Logo picker section */}
        <View style={styles.logoWrap}>
          <TouchableOpacity onPress={handlePickLogo} disabled={uploading}>
            <View style={styles.logoOuter}>
              <View style={styles.logoCircle}>
                {uploading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : logo ? (
                  <Image source={{ uri: logo }} style={styles.logoImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="storefront-outline" size={36} color={COLORS.primary} />
                )}
              </View>
              <View style={styles.logoEditBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.logoHint}>Tap to upload a store logo from your gallery</Text>

          {logo ? (
            <TouchableOpacity onPress={() => setLogo("")} style={styles.logoBtnDanger}>
              <Ionicons name="trash-outline" size={15} color="#B00020" />
              <Text style={styles.logoBtnDangerText}>Remove Logo</Text>
            </TouchableOpacity>
          ) : null}

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
            style={[styles.input, contactPhone.length >= 7 && !isValidPhone(contactPhone) && styles.inputError]}
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="+234 800 000 0000"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
            maxLength={16}
          />
          {contactPhone.length >= 7 && !isValidPhone(contactPhone) && (
            <Text style={styles.fieldError}>Invalid number - use local (08012345678) or international (+44...)</Text>
          )}

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
        </View>

        {message ? (
          <Text style={[styles.feedback, message.includes("success") && styles.feedbackOk]}>{message}</Text>
        ) : null}

        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <View style={styles.saveBtnInner}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ height: bottomPadding }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 40 },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  header: { alignItems: "center", backgroundColor: COLORS.primary, flexDirection: "row", gap: 10, paddingBottom: 14, paddingHorizontal: 16, paddingTop: 54 },
  back: { padding: 2 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 20, fontWeight: "700" },

  logoWrap: { alignItems: "center", paddingTop: 24, paddingBottom: 8, paddingHorizontal: 16 },
  logoOuter: { height: 90, width: 90 },
  logoCircle: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 999,
    borderWidth: 1,
    height: 90,
    justifyContent: "center",
    overflow: "hidden",
    width: 90,
  },
  logoImage: { height: 90, width: 90 },
  logoEditBadge: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderColor: COLORS.background,
    borderRadius: 999,
    borderWidth: 2,
    bottom: 0,
    height: 26,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    width: 26,
  },
  logoHint: { color: COLORS.muted, fontSize: 12, marginTop: 10 },
  logoBtnDanger: {
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    borderColor: "#B00020",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoBtnDangerText: { color: "#B00020", fontSize: 13, fontWeight: "600" },
  avatarHint: { color: COLORS.muted, fontSize: 12, marginTop: 12, textAlign: "center", paddingHorizontal: 20, lineHeight: 17 },

  form: { paddingHorizontal: 16, marginTop: 8 },
  label: { color: COLORS.muted, fontSize: 12, marginTop: 14 },
  input: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, color: COLORS.text, fontSize: 14, marginTop: 4, paddingHorizontal: 14, paddingVertical: 12 },
  multiline: { height: 90, textAlignVertical: "top" },
  feedback: { color: "#B00020", fontWeight: "600", marginTop: 12, marginHorizontal: 16 },
  feedbackOk: { color: "#0B7A4B" },
  saveBtn: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 10, marginHorizontal: 16, marginTop: 20, paddingVertical: 14 },
  saveBtnInner: { alignItems: "center", flexDirection: "row", gap: 8 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  inputError: { borderColor: "#B00020" },
  fieldError: { color: "#B00020", fontSize: 11, fontWeight: "600", marginTop: 3 },
});
