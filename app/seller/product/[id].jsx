import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../constants/colors";
import { createSellerProduct, getSellerProducts, updateSellerProduct } from "../../../api/seller";
import { getSession } from "../../../storage/insecure";
import { CONFIG } from "../../../constants/config";

const CATEGORY_OPTIONS = ["Computers & Accessories", "Phones & Tablets", "Electronics", "Fashion", "Home & Kitchen", "Kids & Toys", "Beauty & Health", "Furniture", "Lab Gear"];

function splitCSV(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function SellerProductFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = useMemo(() => String(params.id || "new"), [params.id]);
  const isNew = productId === "new";

  const [sellerId, setSellerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [existingProduct, setExistingProduct] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [brand, setBrand] = useState("");
  const [priceNaira, setPriceNaira] = useState("0");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [stock, setStock] = useState("0");
  const [shippingFeeNaira, setShippingFeeNaira] = useState("0");
  const [colors, setColors] = useState("Default");
  const [sizes, setSizes] = useState("Standard");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      const { user } = await getSession();
      if (!mounted) return;
      const nextSellerId = user?.sellerId || user?.id || "s1";
      setSellerId(nextSellerId);

      if (!isNew) {
        const response = await getSellerProducts({ sellerId: nextSellerId });
        if (!mounted) return;
        const product = (response.data || []).find((entry) => entry.id === productId);
        setExistingProduct(product || null);
        if (product) {
          setName(product.name || "");
          setCode(product.code || "");
          setBrand(product.brand || "");
          setPriceNaira(String(product.priceNaira || 0));
          setCategory(product.category || CATEGORY_OPTIONS[0]);
          setStock(String(product.stock || 0));
          setShippingFeeNaira(String(product.shippingFeeNaira || 0));
          setColors(Array.isArray(product.colors) ? product.colors.join(", ") : "Default");
          setSizes(Array.isArray(product.sizes) ? product.sizes.join(", ") : "Standard");
          setDescription(product.description || "");
          setImageUri(product.image || "");
        }
      }

      setLoading(false);
    }

    boot().catch((error) => {
      setMessage(error.message || "Unable to load product form");
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [isNew, productId]);

  // PWN-M008: uploads image to /api/products/upload-image via multipart form-data
  // Multer on the server writes file.originalname directly to disk — no path sanitization
  // Intercept with Burp Suite, change filename to "../server.js" to overwrite the backend
  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Photo access is required to pick an image. You can still paste an image URL below.");
      setShowImageInput(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const fileName = asset.fileName || `product_${Date.now()}.jpg`;
    const mimeType = asset.mimeType || "image/jpeg";

    try {
      const formData = new FormData();
      formData.append("image", { uri: asset.uri, name: fileName, type: mimeType });

      const response = await fetch(`${CONFIG.BASE_URL}/api/products/upload-image`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.ok) {
        setImageUri(`${CONFIG.BASE_URL}${data.url}`);
      } else {
        setMessage(data.error || "Upload failed");
        setShowImageInput(true);
      }
    } catch {
      setMessage("Upload failed. You can paste an image URL below.");
      setShowImageInput(true);
    }
    setShowImageInput(false);
  }

  async function handleSave() {
    setMessage("");
    setSaving(true);
    try {
      const payload = {
        sellerId,
        name,
        code,
        brand,
        priceNaira: Number(priceNaira || 0),
        category,
        stock: Number(stock || 0),
        shippingFeeNaira: Number(shippingFeeNaira || 0),
        colors: splitCSV(colors),
        sizes: splitCSV(sizes),
        description,
        image: imageUri,
      };

      if (isNew) {
        await createSellerProduct(payload);
      } else {
        await updateSellerProduct(productId, payload);
      }

      router.back();
    } catch (error) {
      setMessage(error.message || "Unable to save product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{isNew ? "Add Product" : "Edit Product"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Product name" />

        <Text style={styles.label}>Code</Text>
        <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="SKU or code" />

        <Text style={styles.label}>Brand</Text>
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Brand" />

        <Text style={styles.label}>Price (₦)</Text>
        <TextInput style={styles.input} value={priceNaira} onChangeText={setPriceNaira} keyboardType="numeric" placeholder="0" />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {CATEGORY_OPTIONS.map((item) => (
            <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}>
              <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Stock</Text>
        <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" />

        <Text style={styles.label}>Shipping Fee (₦)</Text>
        <TextInput style={styles.input} value={shippingFeeNaira} onChangeText={setShippingFeeNaira} keyboardType="numeric" placeholder="0" />

        <Text style={styles.label}>Colors</Text>
        <TextInput style={styles.input} value={colors} onChangeText={setColors} placeholder="Black, White" />

        <Text style={styles.label}>Sizes</Text>
        <TextInput style={styles.input} value={sizes} onChangeText={setSizes} placeholder="Standard, XL" />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe the product" multiline />

        <Text style={styles.label}>Image</Text>
        <TouchableOpacity onPress={handlePickImage} style={styles.imageBtn}>
          <Text style={styles.imageBtnText}>{imageUri ? "Change Product Image" : "Pick Product Image"}</Text>
        </TouchableOpacity>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

        {showImageInput ? (
          <>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Enter image URL or paste a data URI"
              value={imageUri}
              onChangeText={setImageUri}
            />
            <TouchableOpacity onPress={() => setShowImageInput(false)} style={styles.imageBtn}>
              <Text style={styles.imageBtnText}>Use Pasted Image</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Product</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: "center", backgroundColor: COLORS.background, flex: 1, justifyContent: "center" },
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingBottom: 30, paddingTop: 54 },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    padding: 18,
  },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 24, fontWeight: "700" },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  label: { color: COLORS.muted, marginTop: 12 },
  input: {
    backgroundColor: "#fff",
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textArea: { minHeight: 96, textAlignVertical: "top" },
  chipsRow: { marginTop: 8 },
  chip: {
    backgroundColor: "#fff",
    borderColor: COLORS.borderGray,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  imageBtn: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
  imageBtnText: { color: "#fff", fontWeight: "700" },
  preview: { borderRadius: 12, height: 180, marginTop: 12, width: "100%" },
  message: { color: COLORS.primary, marginTop: 12 },
  saveBtn: {
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  saveText: { color: "#fff", fontWeight: "700" },
});
