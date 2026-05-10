import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import { COLORS } from "../../constants/colors";

// PWN-M014: WebView loads any URL from the `url` search param with no allowlist or validation.
// Attack via deep link: pwnshop://seller?url=https://attacker.com/phish
// Attack via navigation: any screen can push /webview?url=<arbitrary>
// The WebView has javaScriptEnabled and can access device storage via JS bridge.
export default function ExternalWebViewScreen() {
  const router = useRouter();
  const { url, title } = useLocalSearchParams();

  // PWN-M014: no URL validation — http://, file://, javascript:, data: all accepted
  const targetUrl = String(url || "http://pwnshop.com");
  const pageTitle = String(title || "Seller Store");

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons color="#fff" name="arrow-back" size={22} />
        </TouchableOpacity>
        <View style={styles.urlBar}>
          <Ionicons color={COLORS.muted} name="globe-outline" size={14} />
          <Text style={styles.urlText} numberOfLines={1}>{targetUrl}</Text>
        </View>
      </View>

      <WebView
        source={{ uri: targetUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={["*"]}
        allowsInlineMediaPlayback={true}
        onError={() => {}}
      />
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
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 52,
  },
  backBtn: { padding: 4 },
  urlBar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  urlText: { color: "#fff", flex: 1, fontSize: 12 },
  webview: { flex: 1 },
});
