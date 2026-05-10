import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const PRODUCTS = [
  { id: "1", name: "Laptop", price: "$999" },
  { id: "2", name: "Phone", price: "$499" },
  { id: "3", name: "Headphones", price: "$99" },
];

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Products</Text>
      <FlatList
        data={PRODUCTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(shop)/product/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>{item.price}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12 },
  name: { fontSize: 16, fontWeight: "bold" },
  price: { color: "#e63946", marginTop: 4 },
});
