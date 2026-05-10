import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import { useCart } from "../context/CartContext";
import { COLORS } from "../../constants/colors";
import { MEDIA } from "../../constants/media";
import { addProductReview, getProductById } from "../../api/products";
import { addToWishlist, removeFromWishlist } from "../../api/wishlist";
import { getSession } from "../../storage/insecure";

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

const COLOR_OPTIONS = ["Black", "White", "Red", "Default"];
const SIZE_OPTIONS = ["Small", "Medium", "Large", "Standard"];

function parseFlashEnd(endsAt) {
  if (!endsAt) return null;
  const s = String(endsAt).replace(/(\d{4}-\d{2}-\d{2})-T/, "$1T").trim();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function getFlashRemaining(endsAt) {
  const end = parseFlashEnd(endsAt);
  if (!end) return null;
  const diff = end - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function FlashCountdown({ endsAt }) {
  const [remaining, setRemaining] = useState(() => getFlashRemaining(endsAt));
  const end = parseFlashEnd(endsAt);
  const endDateStr = end
    ? end.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  useEffect(() => {
    if (!parseFlashEnd(endsAt)) return;
    const id = setInterval(() => {
      const next = getFlashRemaining(endsAt);
      setRemaining(next);
      if (!next || next === "Expired") clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!remaining && !endDateStr) return null;

  return (
    <View style={{ backgroundColor: "#FFF8E1", borderRadius: 8, marginTop: 6, paddingHorizontal: 10, paddingVertical: 8 }}>
      <View style={{ alignItems: "center", flexDirection: "row", gap: 6 }}>
        <Ionicons name="flash" size={14} color="#B07800" />
        <Text style={{ color: "#B07800", fontSize: 12, fontWeight: "700" }}>
          {remaining === "Expired" ? "Flash sale ended" : remaining ? `Ends in ${remaining}` : "Flash sale"}
        </Text>
      </View>
      {endDateStr ? (
        <Text style={{ color: "#A06000", fontSize: 11, marginTop: 3 }}>
          {remaining === "Expired" ? "Ended" : "Ends"}: {endDateStr}
        </Text>
      ) : null}
    </View>
  );
}

function getProductImage(productData) {
  if (!productData) return MEDIA_MAP.p1;
  
  // Check if it's a seed product with a MEDIA map entry
  const mediaImage = MEDIA_MAP[productData.id];
  if (mediaImage) return mediaImage;
  
  // Handle product image (could be data URI or path)
  if (productData.image) {
    if (productData.image.startsWith('data:')) {
      return { uri: productData.image };
    } else if (productData.image.startsWith('/')) {
      return { uri: `file://${productData.image}` };
    } else {
      return { uri: productData.image };
    }
  }
  
  return MEDIA_MAP.p1;
}

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = React.useState(null);
  const { addToCart } = useCart();
  const [qty, setQty] = React.useState(1);
  const [selectedColor, setSelectedColor] = React.useState("Default");
  const [selectedSize, setSelectedSize] = React.useState("Standard");
  const [inWishlist, setInWishlist] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [reviews, setReviews] = React.useState([]);
  const [reviewAuthor, setReviewAuthor] = React.useState("");
  const [reviewHtml, setReviewHtml] = React.useState("");
  const [reviewRating, setReviewRating] = React.useState("5");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      const { user: storedUser } = await getSession();
      if (mounted) {
        setUser(storedUser);
      }

      try {
        const res = await getProductById(id || "p1");
        if (mounted && res && res.data) {
          setProduct(res.data);
          setReviews(Array.isArray(res.data.reviews) ? res.data.reviews : []);
        }
      } catch (e) {
        // fallback to a minimal object
        setProduct({ id: id || "p1", name: "Unknown Product", priceNaira: 0, code: "-", brand: "-", colors: ["Default"], sizes: ["Standard"] });
        setReviews([]);
      }
    }
    load();
    return () => (mounted = false);
  }, [id]);

  function formatNaira(n) {
    if (typeof n !== "number") return String(n);
    return (
      "₦" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    );
  }

  function handleAdd() {
    // Validate stock before adding
    if (!product || !product.stock || qty > product.stock) {
      Alert.alert("Out of stock", `Cannot add ${qty} item${qty > 1 ? 's' : ''}. Only ${product?.stock || 0} available in stock.`);
      return;
    }
    
    const effectivePrice = product?.flashSale && Number(product?.flashSalePrice) > 0
      ? product.flashSalePrice
      : (product?.priceNaira || product?.price || 0);
    addToCart({
      id: id || "p1",
      name: product?.name || "Unknown Product",
      price: effectivePrice,
      shippingFeeNaira: product?.shippingFeeNaira || 0,
      image: getProductImage(product),
      qty,
      color: selectedColor,
      size: selectedSize,
    });
    router.push("/(tabs)/cart");
  }

  async function submitReview() {
    const html = reviewHtml.trim();
    if (!html || submittingReview) {
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await addProductReview(id || "p1", {
        authorName: reviewAuthor.trim() || (user?.name || "Guest Reviewer"),
        html,
        rating: Number(reviewRating || 5),
        userId: user?.id || "u1",
      });

      if (response?.data) {
        setReviews((current) => [response.data, ...current]);
      }

      setReviewHtml("");
      setReviewAuthor("");
      setReviewRating("5");
    } catch (error) {
      Alert.alert("Review failed", error.message || "Unable to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleWishlist() {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }

    if (inWishlist) {
      const res = await removeFromWishlist(id || "p1");
      if (res.ok) setInWishlist(false);
    } else {
      const res = await addToWishlist(id || "p1");
      if (res.ok) setInWishlist(true);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Choose Options</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Image source={getProductImage(product)} style={styles.image} resizeMode="cover" />
        <Text style={styles.name}>{product ? product.name : "Loading..."}</Text>
        <Text style={styles.meta}>Product Code: <Text style={{ color: COLORS.primary }}>{product ? product.code : "-"}</Text></Text>
        <Text style={styles.meta}>Brand: <Text style={{ color: COLORS.primary }}>{product ? product.brand : "-"}</Text></Text>

        {product?.flashSale ? (
          <View>
            <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
              <Text style={[styles.price, { color: COLORS.accent }]}>{formatNaira(product.flashSalePrice || 0)}</Text>
              <Text style={[styles.price, { color: COLORS.muted, fontSize: 16, textDecorationLine: "line-through" }]}>{formatNaira(product.priceNaira || 0)}</Text>
            </View>
            <FlashCountdown endsAt={product.flashSaleEndsAt} />
          </View>
        ) : (
          <Text style={styles.price}>{formatNaira(product ? (product.priceNaira || 0) : 0)}</Text>
        )}
        <Text style={styles.shipping}>Shipping: ₦{Number(product?.shippingFeeNaira || 0).toLocaleString()}</Text>
        <Text style={styles.stock}>Stock Available: <Text style={{ color: COLORS.primary, fontWeight: "700" }}>{product?.stock || 0}</Text></Text>

        <View style={styles.qtyRow}>
          <Text style={{ marginRight: 8 }}>Quantity:</Text>
          <TouchableOpacity onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn}><Text>-</Text></TouchableOpacity>
          <View style={styles.qtyBox}><Text>{qty}</Text></View>
          <TouchableOpacity onPress={() => setQty((q) => Math.min(product?.stock || 1, q + 1))} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
        </View>

        <View style={styles.bulkBox}><Text style={{ color: COLORS.primary }}>Call us for Bulk Purchases: 07080635700</Text></View>

        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Color</Text>
          <View style={styles.chipRow}>
            {(product?.colors || COLOR_OPTIONS).map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[styles.chip, selectedColor === color && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedColor === color && styles.chipTextActive]}>{color}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.selectionText}>Selected color: {selectedColor}</Text>
        </View>

        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Size</Text>
          <View style={styles.chipRow}>
            {(product?.sizes || SIZE_OPTIONS).map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => setSelectedSize(size)}
                style={[styles.chip, selectedSize === size && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedSize === size && styles.chipTextActive]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.selectionText}>Selected size: {selectedSize}</Text>
        </View>

        <TouchableOpacity onPress={handleAdd} style={styles.cta}>
          <Text style={styles.ctaText}>Add To Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleWishlist} style={[styles.secondaryCta, inWishlist && styles.wishlistActive]}>
          <Ionicons color={inWishlist ? COLORS.accent : COLORS.text} name={inWishlist ? "heart" : "heart-outline"} size={18} />
          <Text style={[styles.secondaryCtaText, inWishlist && styles.wishlistActiveText]}>{inWishlist ? "In Wishlist" : "Add to Wishlist"}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery & Returns</Text>
          <Text style={styles.cardText}>Estimated delivery time 1-9 business days. Express delivery available for select products. Note: Availability may vary by location.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Return Policy</Text>
          <Text style={styles.cardText}>Guaranteed 7-Day Return Policy. For details about return shipping options, please visit the Konga Return Policy.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Warranty</Text>
          <Text style={styles.cardText}>Warranty information unavailable for this item.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Reviews</Text>
          <Text style={styles.cardText}>Share your experience with this product. Your review helps other shoppers make better decisions.</Text>

          <TextInput
            placeholder="Your name"
            placeholderTextColor={COLORS.muted}
            style={styles.reviewInput}
            value={reviewAuthor}
            onChangeText={setReviewAuthor}
          />
          <TextInput
            placeholder="Write your review…"
            placeholderTextColor={COLORS.muted}
            style={[styles.reviewInput, styles.reviewTextarea]}
            value={reviewHtml}
            onChangeText={setReviewHtml}
            multiline
          />
          <TextInput
            placeholder="Rating 1-5"
            placeholderTextColor={COLORS.muted}
            style={styles.reviewInput}
            value={reviewRating}
            onChangeText={setReviewRating}
            keyboardType="numeric"
          />

          <TouchableOpacity disabled={submittingReview} onPress={submitReview} style={styles.reviewButton}>
            <Text style={styles.reviewButtonText}>{submittingReview ? "Posting..." : "Post Review"}</Text>
          </TouchableOpacity>

          <View style={styles.reviewList}>
            {reviews.length === 0 ? (
              <Text style={styles.cardText}>No reviews yet.</Text>
            ) : reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <Text style={styles.reviewMeta}>{review.authorName || "Guest Reviewer"} • {Number(review.rating || 0).toFixed(1)}</Text>
                <View style={styles.reviewWebWrap}>
                  <WebView
                    originWhitelist={["*"]}
                    source={{ html: String(review.html || "") }}
                    javaScriptEnabled
                    domStorageEnabled
                    style={styles.reviewWebView}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seller Information</Text>
          {product?.sellerInfo ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.sellerAvatar}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{product.sellerInfo.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.text }}>{product.sellerInfo.name}</Text>
                    {product.sellerInfo.verified && (
                      <Text style={{ color: '#0B7A4B', fontSize: 11, fontWeight: '700' }}>✓ VERIFIED</Text>
                    )}
                  </View>
                  <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                    {product.sellerInfo.yearsSelling > 0
                      ? `${product.sellerInfo.yearsSelling} ${product.sellerInfo.yearsSelling === 1 ? 'year' : 'years'} selling on Pwnshop`
                      : 'New seller on Pwnshop'}
                  </Text>
                </View>
              </View>
              {product.sellerInfo.website ? (
                // PWN-M014: url passed directly to WebView with no allowlist validation
                <TouchableOpacity
                  onPress={() => router.push(`/webview?url=${encodeURIComponent(product.sellerInfo.website)}&title=${encodeURIComponent(product.sellerInfo.name)}`)}
                  style={styles.visitStoreBtn}
                >
                  <Ionicons name="globe-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.visitStoreText}>Visit Store Website</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.sellerAvatar}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>P</Text>
              </View>
              <View>
                <Text style={{ fontWeight: '700', color: COLORS.text }}>Pwnshop Partner Seller</Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>Verified by Pwnshop</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 54,
  },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 22, fontWeight: "700" },
  body: { padding: 16, paddingBottom: 32 },
  image: { borderRadius: 10, height: 190, width: "100%" },
  name: { color: COLORS.text, fontSize: 22, fontWeight: "700", marginTop: 12 },
  price: { color: COLORS.primary, fontSize: 20, fontWeight: "700", marginTop: 6 },
  shipping: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  stock: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  optionGroup: {
    marginTop: 12,
  },
  optionLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  selectionText: {
    color: COLORS.muted,
    marginTop: 8,
  },
  option: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  optionText: { color: COLORS.text, fontWeight: "600" },
  cta: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  ctaText: { color: "#fff", fontWeight: "700" },
  secondaryCta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 12,
    justifyContent: "center",
  },
  secondaryCtaText: { color: COLORS.text, fontWeight: "700" },
  wishlistActive: { backgroundColor: "rgba(255, 0, 102, 0.1)", borderColor: COLORS.accent },
  wishlistActiveText: { color: COLORS.accent },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  qtyBtn: { backgroundColor: COLORS.card, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  qtyBox: { backgroundColor: "#fff", borderColor: COLORS.borderGray, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 8 },
  bulkBox: { backgroundColor: '#ffeef6', borderRadius: 6, padding: 10, marginTop: 12 },
  card: { backgroundColor: COLORS.card, borderRadius: 8, borderColor: COLORS.borderGray, borderWidth: 1, marginTop: 14, padding: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 6 },
  cardText: { color: COLORS.muted, lineHeight: 18 },
  reviewInput: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reviewTextarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  reviewButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 10,
    paddingVertical: 12,
  },
  reviewButtonText: { color: "#fff", fontWeight: "700" },
  reviewList: { marginTop: 12 },
  reviewCard: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
  },
  reviewMeta: { color: COLORS.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  reviewWebWrap: { height: 120, overflow: "hidden", borderRadius: 8 },
  reviewWebView: { backgroundColor: "transparent", height: 120 },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  visitStoreBtn: { alignItems: 'center', borderColor: COLORS.primary, borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 12, paddingVertical: 10 },
  visitStoreText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});