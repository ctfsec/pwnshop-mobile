import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { FlatList, ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getProducts, searchProducts } from "../../api/products";
import { addToWishlist } from "../../api/wishlist";
import { COLORS } from "../../constants/colors";
import { MEDIA } from "../../constants/media";
import { CONFIG } from "../../api/config";

const SLUG_TO_CATEGORY = {
  "browse-all": null,
  fashion: "Fashion",
  computers: "Computers & Accessories",
  phones: "Phones",
  electronics: "Electronics",
  deals: "Deals",
  "home-kitchen": "Home",
  "kids-toys": "Kids",
  "beauty-health": "Beauty & Health",
};

function parseFlashEndCat(endsAt) {
  if (!endsAt) return null;
  const s = String(endsAt).replace(/(\d{4}-\d{2}-\d{2})-T/, "$1T").trim();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function calcFlashLabel(endsAt) {
  const end = parseFlashEndCat(endsAt);
  if (!end) return null;
  const diff = end - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function FlashBadge({ endsAt }) {
  const [label, setLabel] = useState(() => calcFlashLabel(endsAt));

  useEffect(() => {
    if (!parseFlashEndCat(endsAt)) return;
    const id = setInterval(() => {
      const next = calcFlashLabel(endsAt);
      setLabel(next);
      if (!next) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!label) return null;
  return (
    <View style={styles.flashBadge}>
      <Text style={styles.flashBadgeText}>⚡ {label}</Text>
    </View>
  );
}

function ProductCard({ item, onChoose }) {
  const [wished, setWished] = useState(false);

  async function handleWishlist() {
    const res = await addToWishlist(item.id);
    if (res.ok) setWished(true);
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.heart} onPress={handleWishlist}>
        <Ionicons color={COLORS.accent} name={wished ? "heart" : "heart-outline"} size={18} />
      </TouchableOpacity>
      <Image source={item.image} style={styles.imageStub} resizeMode="cover" />
      <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
      {item.flashSale ? (
        <View>
          <Text style={[styles.price, { color: COLORS.accent }]}>{item.flashPrice}</Text>
          <Text style={[styles.oldPrice, { textDecorationLine: "line-through" }]}>{item.price}</Text>
          <FlashBadge endsAt={item.flashSaleEndsAt} />
        </View>
      ) : (
        <View>
          <Text style={styles.price}>{item.price}</Text>
          <Text style={styles.oldPrice}>{item.oldPrice}</Text>
        </View>
      )}
      <Text numberOfLines={1} style={styles.seller}>{item.seller}</Text>
      <Text style={styles.rating}>⭐ {item.rating}</Text>
      <TouchableOpacity onPress={() => onChoose(item.id)} style={styles.chooseBtn}>
        <Text style={styles.chooseText}>Choose Options</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CategoryScreen() {
  const router = useRouter();
  const { slug, search } = useLocalSearchParams();
  const label = String(slug || "fashion").replace(/-/g, " ");
  const FILTER_CYCLE = ["all", "Fashion", "Electronics", "Phones & Tablets", "Computers & Accessories", "Home & Kitchen", "Beauty & Health"];
  const [filterMode, setFilterMode] = useState("all");
  const [sortMode, setSortMode] = useState("default");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(String(search || ""));

  const onChooseOptions = (id) => {
    router.push(`/product/${id}`);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // PWN-M007: search term goes to SQL endpoint (injectable); browsing stays in-memory
        let res;
        if (searchTerm.trim()) {
          res = await searchProducts(searchTerm.trim());
        } else {
          const category = SLUG_TO_CATEGORY[slug] || undefined;
          const params = {};
          if (category) params.category = category;
          res = await getProducts(params);
        }
        if (mounted && res && res.data) {
          setProducts(
            res.data.map((p) => {
              const PRODUCT_IMAGE_MAP = {
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
              let imageSource = PRODUCT_IMAGE_MAP[p.id];

              // Seller-created products have dynamic IDs (e.g. p_lz9abc_xyz12) not in the map.
              // Use the uploaded image URL from the backend if available.
              if (!imageSource && p.image) {
                const imgPath = String(p.image);
                if (imgPath.startsWith("/uploads/") || imgPath.startsWith("/assets/")) {
                  imageSource = { uri: `${CONFIG.BASE_URL}${imgPath}` };
                } else if (imgPath.startsWith("http")) {
                  imageSource = { uri: imgPath };
                }
              }

              // Last resort: generic category image so the card never shows blank
              if (!imageSource) {
                const fallbacks = {
                  fashion: MEDIA.categoryJeans,
                  computers: MEDIA.categoryTablet,
                  phones: MEDIA.categoryXiomi,
                  electronics: MEDIA.categoryWalkieTalkie,
                  "home-kitchen": MEDIA.categoryKettle,
                  "kids-toys": MEDIA.categoryKidRide,
                  "beauty-health": MEDIA.categoryNivea,
                };
                imageSource = fallbacks[slug] || MEDIA.categoryKids;
              }
              
              return {
                id: p.id,
                name: p.name,
                price: `₦${String(p.priceNaira).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
                oldPrice: p.oldPrice || null,
                seller: p.brand,
                category: p.category || "",
                rating: p.rating || "0",
                image: imageSource,
                flashSale: Boolean(p.flashSale),
                flashPrice: p.flashSale ? `₦${String(p.flashSalePrice || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : null,
                flashSaleEndsAt: p.flashSaleEndsAt || null,
              };
            })
          );
        }
      } catch (e) {
        // fallback: empty
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [slug, searchTerm]);

  useEffect(() => {
    setSearchTerm(String(search || ""));
  }, [search]);

  const filteredAndSorted = useMemo(() => {
    let data = [...products];

    if (filterMode !== "all") {
      data = data.filter((item) =>
        String(item.category || item.seller || "").toLowerCase().includes(filterMode.toLowerCase())
      );
    }

    if (sortMode === "price-asc") {
      data.sort((a, b) => Number(String(a.price).replace(/[^0-9.]/g, "")) - Number(String(b.price).replace(/[^0-9.]/g, "")));
    } else if (sortMode === "price-desc") {
      data.sort((a, b) => Number(String(b.price).replace(/[^0-9.]/g, "")) - Number(String(a.price).replace(/[^0-9.]/g, "")));
    } else if (sortMode === "rating-desc") {
      data.sort((a, b) => Number(b.rating) - Number(a.rating));
    }

    return data;
  }, [filterMode, products, sortMode]);

  const cycleFilter = () => {
    setFilterMode((current) => {
      const idx = FILTER_CYCLE.indexOf(current);
      return FILTER_CYCLE[(idx + 1) % FILTER_CYCLE.length];
    });
  };

  const cycleSort = () => {
    setSortMode((current) => {
      if (current === "default") return "price-asc";
      if (current === "price-asc") return "price-desc";
      if (current === "price-desc") return "rating-desc";
      return "default";
    });
  };

  const submitSearch = () => {
    router.replace(`/category/${slug}?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons color={COLORS.card} name="arrow-back" size={22} />
        </TouchableOpacity>
        <View style={styles.searchWrap}>
          <Ionicons color={COLORS.muted} name="search" size={16} />
          <TextInput
            placeholder="Search in category"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity>
          <Ionicons color={COLORS.card} name="cart" size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Pwnshop {label}</Text>
        <Text style={styles.count}>{filteredAndSorted.length} results</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity onPress={cycleFilter} style={styles.filterBtn}><Text style={styles.filterText}>Filter: {filterMode === "all" ? "All" : filterMode}</Text></TouchableOpacity>
        <TouchableOpacity onPress={cycleSort} style={styles.filterBtn}><Text style={styles.filterText}>Sort: {sortMode === "default" ? "Default" : sortMode === "price-asc" ? "Price Low" : sortMode === "price-desc" ? "Price High" : "Top Rated"}</Text></TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Style Drop</Text>
        <Text style={styles.bannerSub}>Fresh fits for your next challenge.</Text>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      <FlatList
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        data={filteredAndSorted}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard item={item} onChoose={onChooseOptions} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  topBar: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 52,
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    flex: 1,
    flexDirection: "row",
    marginHorizontal: 10,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12 },
  title: { color: COLORS.text, fontSize: 20, fontFamily: "Syne_700Bold", fontWeight: "700", textTransform: "capitalize" },
  count: { color: COLORS.muted, marginTop: 6 },
  filterRow: { columnGap: 10, flexDirection: "row", paddingHorizontal: 16, paddingTop: 10 },
  filterBtn: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  filterText: { color: COLORS.text, fontWeight: "700", textAlign: "center" },
  banner: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
  },
  bannerTitle: { color: "#fff", fontSize: 18, fontFamily: "Syne_700Bold", fontWeight: "700" },
  bannerSub: { color: "#F2E7FF", marginTop: 4 },
  grid: { paddingBottom: 24, paddingTop: 12 },
  gridRow: { justifyContent: "space-between", paddingHorizontal: 16 },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
    width: "48%",
  },
  heart: { alignSelf: "flex-end" },
  imageStub: { backgroundColor: "#EEE7F6", borderRadius: 8, height: 90, marginTop: 4, width: "100%" },
  name: { color: COLORS.text, fontSize: 13, fontWeight: "700", marginTop: 8 },
  price: { color: COLORS.primary, fontSize: 16, fontWeight: "700", marginTop: 4 },
  oldPrice: { color: COLORS.muted, textDecorationLine: "line-through" },
  seller: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  rating: { color: COLORS.text, fontSize: 12, marginTop: 4 },
  chooseBtn: {
    alignItems: "center",
    borderColor: COLORS.accent,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 8,
  },
  chooseText: { color: COLORS.accent, fontSize: 12, fontWeight: "700" },
  flashBadge: { backgroundColor: "#FFF8E1", borderRadius: 4, marginTop: 3, paddingHorizontal: 4, paddingVertical: 2 },
  flashBadgeText: { color: "#B07800", fontSize: 9, fontWeight: "700" },
});