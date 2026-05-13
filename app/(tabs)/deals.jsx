import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { getProducts } from "../../api/products";
import { MEDIA } from "../../constants/media";

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

// Normalise common admin typos like "2026-05-31-T00:00" → "2026-05-31T00:00"
function normaliseEndsAt(endsAt) {
  if (!endsAt) return null;
  return String(endsAt).replace(/(\d{4}-\d{2}-\d{2})-T/, "$1T").trim();
}

function parseEnd(endsAt) {
  const s = normaliseEndsAt(endsAt);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatEndDate(endsAt) {
  const d = parseEnd(endsAt);
  if (!d) return null;
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getRemaining(endsAt) {
  const end = parseEnd(endsAt);
  if (!end) return null;
  const diff = end - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function Countdown({ endsAt }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt));
  const endDateStr = formatEndDate(endsAt);

  useEffect(() => {
    const end = parseEnd(endsAt);
    if (!end) return;
    const id = setInterval(() => {
      const next = getRemaining(endsAt);
      setRemaining(next);
      if (!next || next === "Expired") clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endDateStr && !remaining) return null;

  return (
    <View style={styles.countdownBlock}>
      {remaining && remaining !== "Expired" ? (
        <View style={styles.countdownRow}>
          <Ionicons name="time-outline" size={12} color="#B07800" />
          <Text style={styles.countdownText}>Ends in {remaining}</Text>
        </View>
      ) : remaining === "Expired" ? (
        <Text style={styles.expiredText}>Sale ended</Text>
      ) : null}
      {endDateStr ? (
        <Text style={styles.endDateText}>
          {remaining === "Expired" ? "Ended" : "Ends"}:{" "}
          {endDateStr}
        </Text>
      ) : null}
    </View>
  );
}

function DealCard({ item, onPress }) {
  const salePrice = Number(item.flashSalePrice) || 0;
  const origPrice = Number(item.priceNaira) || 0;
  const savings = origPrice > 0 && salePrice > 0 && origPrice > salePrice ? origPrice - salePrice : null;
  const pct = savings !== null && origPrice > 0 ? Math.round((savings / origPrice) * 100) : null;
  const image = PRODUCT_IMAGE_MAP[item.id];

  return (
    <TouchableOpacity onPress={() => onPress(item.id)} style={styles.card}>
      {pct !== null && (
        <View style={styles.badgeWrap}>
          <View style={styles.pctBadge}>
            <Text style={styles.pctText}>-{pct}%</Text>
          </View>
        </View>
      )}

      {image ? (
        <Image source={image} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.imagePlaceholder]}>
          <Ionicons name="pricetag-outline" size={32} color={COLORS.muted} />
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cardBrand}>{item.brand}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.salePrice}>₦{salePrice.toLocaleString()}</Text>
          {origPrice > salePrice && (
            <Text style={styles.originalPrice}>₦{origPrice.toLocaleString()}</Text>
          )}
        </View>

        {savings !== null && (
          <Text style={styles.savingsText}>You save ₦{savings.toLocaleString()}</Text>
        )}

        <Countdown endsAt={item.flashSaleEndsAt} />

        <Text style={styles.stockText}>
          {item.stock > 0 ? `${item.stock} left in stock` : "Out of stock"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DealsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const is3ButtonMode = insets.bottom >= 30;
  const bottomPadding = is3ButtonMode ? 20 : 30;
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await getProducts({ flashSale: "true" });
        // Safety: only show items with flashSale explicitly true and a valid sale price
        const valid = (res.data || []).filter(
          (p) => p.flashSale === true && Number(p.flashSalePrice) > 0
        );
        if (mounted) setDeals(valid);
      } catch {
        if (mounted) setDeals([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flash Deals</Text>
        <Text style={styles.headerSub}>Limited-time deals with live countdowns. Grab them before they expire.</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : deals.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="pricetag-outline" size={48} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>No active flash sales</Text>
          <Text style={styles.emptyText}>Check back soon. New deals are added regularly.</Text>
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
          renderItem={({ item }) => (
            <DealCard item={item} onPress={(id) => router.push(`/product/${id}`)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: { backgroundColor: COLORS.primary, paddingBottom: 20, paddingHorizontal: 16, paddingTop: 54 },
  headerTitle: { color: "#fff", fontSize: 26, fontFamily: "Syne_700Bold", fontWeight: "700" },
  headerSub: { color: "#ECE0F8", fontSize: 12, marginTop: 4, lineHeight: 18 },
  list: { padding: 16 },
  empty: { alignItems: "center", flex: 1, justifyContent: "center", padding: 32 },
  emptyTitle: { color: COLORS.text, fontFamily: "Syne_700Bold", fontSize: 18, fontWeight: "700", marginTop: 16, textAlign: "center" },
  emptyText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: "center" },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    overflow: "hidden",
  },
  badgeWrap: { position: "absolute", top: 8, left: 8, zIndex: 1 },
  pctBadge: { backgroundColor: "#B07800", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  pctText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  cardImage: { height: 130, width: 110 },
  imagePlaceholder: { alignItems: "center", backgroundColor: "#F0EBF8", justifyContent: "center" },
  cardBody: { flex: 1, padding: 12 },
  cardName: { color: COLORS.text, fontSize: 14, fontWeight: "700", lineHeight: 19 },
  cardBrand: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  priceRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 8 },
  salePrice: { color: COLORS.accent, fontSize: 18, fontWeight: "800" },
  originalPrice: { color: COLORS.muted, fontSize: 13, textDecorationLine: "line-through" },
  savingsText: { color: "#0B7A4B", fontSize: 11, fontWeight: "600", marginTop: 2 },
  countdownBlock: { marginTop: 6 },
  countdownRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  countdownText: { color: "#B07800", fontSize: 11, fontWeight: "700" },
  endDateText: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  expiredText: { color: "#B00020", fontSize: 11, fontWeight: "700" },
  stockText: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
});
