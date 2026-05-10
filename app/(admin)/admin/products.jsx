import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../constants/colors";
import { deleteAdminProduct, getAdminProducts, updateAdminProduct } from "../../../api/admin";

function money(v) { return `₦${Number(v || 0).toLocaleString()}`; }

function FlashModal({ product, onClose, onSave }) {
  const [price, setPrice] = useState(String(product.flashSalePrice || ""));
  const [endsAt, setEndsAt] = useState(product.flashSaleEndsAt || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onSave({ flashSale: true, flashSalePrice: Number(price || 0), flashSaleEndsAt: endsAt });
    setBusy(false);
  }

  return (
    <View style={modal.wrap}>
      <View style={modal.box}>
        <Text style={modal.title}>Flash Sale: {product.name}</Text>
        <Text style={modal.label}>Sale Price (₦)</Text>
        <TextInput style={modal.input} value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="0" />
        <Text style={modal.label}>Ends At (YYYY-MM-DDTHH:MM)</Text>
        <TextInput style={modal.input} value={endsAt} onChangeText={setEndsAt} placeholder="2026-05-31T23:59" />
        <View style={modal.btnRow}>
          <TouchableOpacity onPress={onClose} style={modal.cancel}><Text style={modal.cancelText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={save} style={modal.save} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modal.saveText}>Set Flash Sale</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function AdminProductsScreen() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState({});
  const [flashTarget, setFlashTarget] = useState(null);

  async function load() {
    try {
      const res = await getAdminProducts();
      setProducts(res.data || []);
    } catch (e) {
      setMessage(e.message || "Unable to load products");
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id, payload, msg) {
    setBusy((b) => ({ ...b, [id]: true }));
    setMessage("");
    try {
      await updateAdminProduct(id, payload);
      await load();
      setMessage(msg);
    } catch (e) {
      setMessage(e.message || "Action failed");
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }

  async function remove(id) {
    setBusy((b) => ({ ...b, [id]: true }));
    setMessage("");
    try {
      await deleteAdminProduct(id);
      await load();
      setMessage("Product removed.");
    } catch (e) {
      setMessage(e.message || "Unable to delete");
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Product Management</Text>
          <Text style={styles.subtitle}>Feature, flash sale, and remove catalog items.</Text>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {products.map((product) => (
          <View key={product.id} style={styles.card}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.meta}>{product.category} · {money(product.priceNaira)}</Text>
                <Text style={styles.meta}>Seller: {product.sellerId || "n/a"} · Stock: {product.stock ?? "?"}</Text>
              </View>
              <View style={styles.badges}>
                {product.featured && <View style={styles.featuredBadge}><Text style={styles.badgeText}>FEATURED</Text></View>}
                {product.flashSale && <View style={styles.flashBadge}><Text style={styles.badgeText}>⚡ SALE</Text></View>}
              </View>
            </View>

            {product.flashSale && (
              <Text style={styles.flashInfo}>
                Sale Price: {money(product.flashSalePrice)} · Ends: {product.flashSaleEndsAt || "—"}
              </Text>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={() => act(product.id, { featured: !product.featured }, product.featured ? "Unfeatured" : "Featured")}
                style={[styles.featureBtn, product.featured && styles.featuredActive]}
                disabled={busy[product.id]}
              >
                {busy[product.id] ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>{product.featured ? "Unfeature" : "Feature"}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => product.flashSale ? act(product.id, { flashSale: false }, "Flash sale removed") : setFlashTarget(product)}
                style={[styles.flashBtn, product.flashSale && styles.flashActive]}
                disabled={busy[product.id]}
              >
                <Text style={styles.btnText}>{product.flashSale ? "End Sale" : "Flash Sale"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(product.id)} style={styles.deleteBtn} disabled={busy[product.id]}>
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {flashTarget && (
        <FlashModal
          product={flashTarget}
          onClose={() => setFlashTarget(null)}
          onSave={async (payload) => {
            await act(flashTarget.id, payload, `Flash sale set on ${flashTarget.name}`);
            setFlashTarget(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 16, paddingBottom: 30, paddingTop: 54 },
  header: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16 },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#ECE0F8", marginTop: 5 },
  message: { color: COLORS.primary, fontWeight: "600", marginTop: 10 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.borderGray, borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 12 },
  topRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  badges: { flexDirection: "column", gap: 4, alignItems: "flex-end" },
  featuredBadge: { backgroundColor: "#1737AA", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  flashBadge: { backgroundColor: "#B07800", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  name: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
  meta: { color: COLORS.muted, marginTop: 3, fontSize: 13 },
  flashInfo: { color: "#B07800", fontSize: 12, fontWeight: "600", marginTop: 4 },
  btnRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  featureBtn: { alignItems: "center", backgroundColor: "#1737AA", borderRadius: 8, flex: 1, paddingVertical: 9 },
  featuredActive: { backgroundColor: COLORS.muted },
  flashBtn: { alignItems: "center", backgroundColor: "#B07800", borderRadius: 8, flex: 1, paddingVertical: 9 },
  flashActive: { backgroundColor: "#0B7A4B" },
  deleteBtn: { alignItems: "center", backgroundColor: "#B00020", borderRadius: 8, flex: 1, paddingVertical: 9 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});

const modal = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24, zIndex: 100 },
  box: { backgroundColor: "#fff", borderRadius: 14, padding: 20 },
  title: { color: COLORS.text, fontWeight: "700", fontSize: 16, marginBottom: 14 },
  label: { color: COLORS.muted, fontSize: 12, marginTop: 10 },
  input: { borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, marginTop: 6, paddingHorizontal: 12, paddingVertical: 10 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancel: { alignItems: "center", borderColor: COLORS.borderGray, borderRadius: 8, borderWidth: 1, flex: 1, paddingVertical: 10 },
  cancelText: { color: COLORS.muted, fontWeight: "700" },
  save: { alignItems: "center", backgroundColor: "#B07800", borderRadius: 8, flex: 1, paddingVertical: 10 },
  saveText: { color: "#fff", fontWeight: "700" },
});
