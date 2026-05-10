import React from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { MEDIA } from "../../constants/media";
import { getSession } from "../../storage/insecure";
import { getWishlist, removeFromWishlist } from "../../api/wishlist";
import { useCart } from "../context/CartContext";

const MEDIA_MAP = {
  p1: MEDIA.categoryChair,
  p2: MEDIA.categoryJeans,
  p3: MEDIA.categoryKitchen,
  p4: MEDIA.categoryTv,
  p5: MEDIA.categoryFlipper,
  p6: MEDIA.categoryKids,
  p7: MEDIA.categoryWalkieTalkie,
  p8: MEDIA.categoryShoes,
  p9: MEDIA.categoryBloodPressure,
  p10: MEDIA.categoryTablet,
  p11: MEDIA.categoryNativeDress,
  p12: MEDIA.categoryIphone17,
  p13: MEDIA.categoryKidRide,
  p14: MEDIA.categoryNivea,
  p15: MEDIA.categoryKettle,
  p16: MEDIA.categoryXiomi,
};

function getItemImage(item) {
  if (MEDIA_MAP[item.productId]) return MEDIA_MAP[item.productId];
  if (item.image) return { uri: item.image };
  return MEDIA_MAP.p1;
}

export default function WishlistScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      (async () => {
        setLoading(true);
        const { user: storedUser } = await getSession();
        if (mounted) {
          setUser(storedUser);
          if (storedUser) {
            const res = await getWishlist();
            if (mounted && res.ok && Array.isArray(res.data)) {
              setWishlist(res.data);
            }
          }
          setLoading(false);
        }
      })();

      return () => (mounted = false);
    }, [])
  );

  async function handleRemove(productId) {
    const res = await removeFromWishlist(productId);
    if (res.ok) {
      setWishlist(res.data || []);
    }
  }

  function handleAddToCart(item) {
    addToCart({
      id: item.productId,
      productId: item.productId,
      name: item.name,
      price: item.priceNaira,
      priceNaira: item.priceNaira,
      shippingFeeNaira: item.shippingFeeNaira,
      qty: 1,
    });
    router.push("/cart");
  }

  if (!user) {
    return (
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Wishlist</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={{ color: COLORS.muted, marginBottom: 12 }}>Sign in to view your wishlist.</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.cta}>
            <Text style={styles.ctaText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Wishlist</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (wishlist.length === 0) {
    return (
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Wishlist</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={{ color: COLORS.muted, marginBottom: 12, textAlign: "center" }}>
            Your wishlist is empty. Add items from products to get started!
          </Text>
          <TouchableOpacity onPress={() => router.push("/")} style={styles.cta}>
            <Text style={styles.ctaText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist</Text>
        <Text style={styles.subtitle}>{wishlist.length} item{wishlist.length !== 1 ? "s" : ""}</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {wishlist.map((item) => (
          <View key={item.productId} style={styles.card}>
            <Image source={getItemImage(item)} style={styles.image} />
            <View style={styles.cardBody}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.price}>₦{Number(item.priceNaira || 0).toLocaleString()}</Text>
              <Text style={styles.shippingFee}>Shipping: ₦{Number(item.shippingFeeNaira || 0).toLocaleString()}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleAddToCart(item)} style={styles.primaryAction}>
                  <Text style={styles.primaryActionText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(item.productId)} style={styles.secondaryAction}>
                  <Text style={styles.secondaryActionText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: { backgroundColor: COLORS.primary, paddingBottom: 14, paddingHorizontal: 16, paddingTop: 54 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 24 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, marginBottom: 12, overflow: "hidden", flexDirection: "row" },
  image: { width: 100, height: 100, backgroundColor: COLORS.borderGray },
  cardBody: { flex: 1, padding: 12 },
  productName: { color: COLORS.text, fontWeight: "700", fontSize: 14, marginBottom: 4 },
  category: { color: COLORS.muted, fontSize: 12, marginBottom: 4 },
  price: { color: COLORS.primary, fontWeight: "700", fontSize: 14, marginBottom: 4 },
  shippingFee: { color: COLORS.muted, fontSize: 11, marginBottom: 8 },
  cardActions: { flexDirection: "row", gap: 8 },
  primaryAction: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 6, paddingVertical: 8, alignItems: "center" },
  primaryActionText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  secondaryAction: { flex: 1, borderColor: COLORS.borderGray, borderRadius: 6, borderWidth: 1, paddingVertical: 8, alignItems: "center" },
  secondaryActionText: { color: COLORS.text, fontWeight: "600", fontSize: 12 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  cta: { alignItems: "center", backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 12, minWidth: 150 },
  ctaText: { color: "#fff", fontWeight: "700" },
});
