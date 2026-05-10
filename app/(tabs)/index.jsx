import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { MEDIA } from "../../constants/media";
import { getProducts } from "../../api/products";

const CATEGORIES = [
  { key: "browse-all", label: "Browse All", icon: "apps" },
  { key: "fashion", label: "Fashion", icon: "shirt" },
  { key: "computers", label: "Computers", icon: "laptop" },
  { key: "phones", label: "Phones", icon: "phone-portrait" },
  { key: "electronics", label: "Electronics", icon: "hardware-chip" },
];

const HERO_BANNERS = [
  { id: "hero-1", title: "Red Team Essentials", subtitle: "Get lab gear up to 40% off", cta: "Hack The Deal", image: MEDIA.heroOne },
  { id: "hero-2", title: "Purple Team Picks", subtitle: "Starter bundles for new challengers", cta: "View Bundles", image: MEDIA.heroTwo },
];

const PRODUCT_IMAGE_MAP = {
  p1: MEDIA.categoryChair, p2: MEDIA.categoryJeans, p3: MEDIA.categoryKitchen,
  p4: MEDIA.categoryTv, p5: MEDIA.categoryFlipper, p6: MEDIA.categoryKids,
  p7: MEDIA.categoryWalkieTalkie, p8: MEDIA.categoryShoes, p9: MEDIA.categoryBloodPressure,
  p10: MEDIA.categoryTablet, p11: MEDIA.categoryNativeDress, p12: MEDIA.categoryIphone17,
  p13: MEDIA.categoryKidRide, p14: MEDIA.categoryNivea, p15: MEDIA.categoryKettle,
  p16: MEDIA.categoryXiomi,
};

function shuffleAndPick(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function HomeTab() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [featured, setFeatured] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      getProducts({}).then((res) => {
        if (!mounted || !res?.data?.length) return;
        const picks = shuffleAndPick(res.data, 4).map((p) => ({
          id: p.id,
          name: p.name,
          seller: p.brand || "Pwnshop Partner",
          price: `₦${Number(p.priceNaira || 0).toLocaleString()}`,
          image: PRODUCT_IMAGE_MAP[p.id] || MEDIA.categoryKids,
          categorySlug: "browse-all",
        }));
        setFeatured(picks);
      }).catch(() => {});
      return () => { mounted = false; };
    }, [])
  );

  const openCategory = (key) => {
    router.push(`/category/${key}`);
  };

  const submitSearch = () => {
    const query = searchTerm.trim();
    if (!query) {
      openCategory("browse-all");
      return;
    }
    router.push(`/category/browse-all?search=${encodeURIComponent(query)}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.page}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/more")}>
          <Ionicons color={COLORS.card} name="menu" size={24} />
        </TouchableOpacity>
        <View style={styles.topIcons}>
          <TouchableOpacity onPress={() => openCategory("browse-all")}>
            <Ionicons color={COLORS.card} name="storefront" size={22} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/cart")}>
            <Ionicons color={COLORS.card} name="cart" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TouchableOpacity onPress={submitSearch} style={styles.searchIconBtn}>
          <Ionicons color={COLORS.muted} name="search" size={18} />
        </TouchableOpacity>
        <TextInput
          placeholder="Search products, brands, categories..."
          placeholderTextColor={COLORS.muted}
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => router.push(`/category/${item.key}`)}
            style={styles.categoryPill}
          >
            <Ionicons color={COLORS.primary} name={item.icon} size={16} />
            <Text style={styles.categoryText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.heroRow}>
        {HERO_BANNERS.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            onPress={() => openCategory(banner.id === "hero-1" ? "deals" : "fashion")}
            style={styles.heroCard}
          >
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{banner.title}</Text>
              <Text style={styles.heroSubtitle}>{banner.subtitle}</Text>
              <View style={styles.heroButton}>
                <Text style={styles.heroButtonText}>{banner.cta}</Text>
              </View>
            </View>
            <Image source={banner.image} style={styles.heroImage} resizeMode="contain" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
        {featured.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => router.push(`/product/${item.id}`)} style={styles.featureCard}>
            <Image source={item.image} style={styles.featureImageStub} resizeMode="cover" />
            <Text numberOfLines={1} style={styles.featureName}>{item.name}</Text>
            <Text numberOfLines={1} style={styles.featureSeller}>{item.seller}</Text>
            <Text style={styles.featurePrice}>{item.price}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Hot Pick</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={() => openCategory("browse-all")} style={styles.flashSale}>
        <Text style={styles.flashTitle}>Flash Sale</Text>
        <Text style={styles.flashLine}>🔥 Up to 60% off</Text>
        <Text style={styles.flashSubtitle}>Limited bundles for tonight's CTF rush.</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  topBar: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
  },
  topIcons: {
    columnGap: 14,
    flexDirection: "row",
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 12,
  },
  searchIconBtn: { paddingVertical: 8, paddingRight: 4 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  categoryRow: {
    marginTop: 14,
    paddingLeft: 16,
  },
  categoryPill: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginRight: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  heroRow: {
    marginTop: 14,
    paddingLeft: 16,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginRight: 12,
    padding: 16,
    width: 300,
  },
  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    color: COLORS.card,
    fontSize: 21,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "#EDE3F8",
    fontSize: 14,
    marginTop: 8,
  },
  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  heroImage: {
    height: 92,
    width: 92,
  },
  sectionHeader: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Syne_700Bold",
  },
  featureCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 16,
    marginTop: 12,
    padding: 12,
    width: 180,
  },
  featureImageStub: {
    backgroundColor: "#EFE4F8",
    borderRadius: 10,
    height: 84,
    width: "100%",
  },
  featureName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
  },
  featureSeller: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  featurePrice: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.gold,
    borderRadius: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#3A2A00",
    fontSize: 11,
    fontWeight: "700",
  },
  flashSale: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
  },
  flashTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  flashLine: {
    color: "#fff",
    fontSize: 16,
    marginTop: 4,
  },
  flashSubtitle: {
    color: "#F0E5FF",
    marginTop: 6,
  },
  todo: {
    color: COLORS.muted,
    fontSize: 12,
    marginHorizontal: 16,
    marginTop: 14,
  },
});