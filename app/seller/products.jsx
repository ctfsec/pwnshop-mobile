import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { getSession } from "../../storage/insecure";
import { deleteSellerProduct, getSellerProducts } from "../../api/seller";

function money(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function SellerProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 45 : 0;
  const [sellerId, setSellerId] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadProducts(nextSellerId) {
    setLoading(true);
    try {
      const response = await getSellerProducts({ sellerId: nextSellerId });
      setProducts(response.data || []);
    } catch (error) {
      setMessage(error.message || "Unable to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (!mounted) return;
      const nextSellerId = user?.sellerId || user?.id || "s1";
      setSellerId(nextSellerId);
      loadProducts(nextSellerId);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleDelete(productId) {
    setMessage("");
    try {
      await deleteSellerProduct(productId);
      await loadProducts(sellerId);
      setMessage("Product deleted.");
    } catch (error) {
      setMessage(error.message || "Unable to delete product");
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>My Products</Text>
        <Text style={styles.subtitle}>Edit, delete, and manage your inventory.</Text>
      </View>

      <TouchableOpacity onPress={() => router.push("/seller/product/new")} style={styles.addBtn}>
        <Text style={styles.addText}>Add New Product</Text>
      </TouchableOpacity>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {loading ? <ActivityIndicator style={{ marginTop: 14 }} /> : null}

      {products.map((product) => (
        <View key={product.id} style={styles.card}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.meta}>{product.category}</Text>
          <Text style={styles.meta}>{money(product.priceNaira)} · Stock {Number(product.stock || 0)}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => router.push(`/seller/product/${product.id}`)} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(product.id)} style={styles.dangerBtn}>
              <Text style={styles.dangerText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {!loading && products.length === 0 ? <Text style={styles.empty}>No products yet.</Text> : null}
      <View style={{ height: bottomPadding }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingBottom: 30, paddingTop: 54 },
  header: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
  },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.85)", marginTop: 6 },
  addBtn: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    marginTop: 14,
    paddingVertical: 12,
  },
  addText: { color: "#fff", fontWeight: "700" },
  message: { color: COLORS.primary, marginTop: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 14,
  },
  name: { color: COLORS.text, fontWeight: "700", fontSize: 16 },
  meta: { color: COLORS.muted, marginTop: 4 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  secondaryBtn: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  secondaryText: { color: COLORS.primary, fontWeight: "700" },
  dangerBtn: {
    alignItems: "center",
    backgroundColor: "#FFE9E9",
    borderColor: "#F5BABA",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  dangerText: { color: "#B00020", fontWeight: "700" },
  empty: { color: COLORS.muted, marginTop: 16 },
});
