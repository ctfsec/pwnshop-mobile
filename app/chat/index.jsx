import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { COLORS } from "../../constants/colors";
import { sendChatMessage } from "../../api/chat";
import { getSession } from "../../storage/insecure";

const QUICK_PROMPTS = [
  "Find me featured sellers",
  "What deals are live now?",
  "Help me compare products",
  "Summarize my cart",
];

const SEED_MESSAGES = [
  {
    id: "seed-1",
    role: "assistant",
    content: "Welcome to Pwnshop Assist. Ask about products, deals, sellers, or cart suggestions.",
  },
];

// PWN-L003: renders LLM output as raw HTML — injected scripts execute in this WebView
// Attack: indirect injection via product description → LLM echoes XSS payload → this renders it
function HtmlBubble({ html }) {
  const [height, setHeight] = useState(60);

  return (
    <WebView
      source={{ html }}
      style={{ height, width: "100%" }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      originWhitelist={["*"]}
      javaScriptEnabled={true}
      backgroundColor="#ffffff"
      injectedJavaScript={`
        (function() {
          function report() {
            var h = document.documentElement.scrollHeight;
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'height', value: h })
            );
          }
          report();
          setTimeout(report, 120);
        })();
        true;
      `}
      onMessage={(e) => {
        try {
          const msg = JSON.parse(e.nativeEvent.data);
          if (msg.type === "height" && msg.value > 0) {
            setHeight(msg.value + 4);
          }
        } catch {}
      }}
    />
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef(null);


  useEffect(() => {
    listRef.current?.scrollToEnd?.({ animated: true });
  }, [messages]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (mounted) {
        setSessionUser(user);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const submitMessage = async (content = input) => {
    const text = content.trim();
    if (!text || sending) {
      return;
    }

    setInput("");
    setSending(true);

    const stamp = Date.now();
    const userMessage = { id: `user-${stamp}`, role: "user", content: text };
    const assistantMessageId = `assistant-${stamp}`;
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantMessageId, role: "assistant", content: "Thinking...", pending: true },
    ]);

    try {
      const response = await sendChatMessage(text, {
        context: ["home-feed", "cart-summary", "category-context"],
        userId: sessionUser?.id || "u1",
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: response?.data?.reply || response.reply || "No response.",
                html: response?.data?.html || response.html || "",
                pending: false,
              }
            : message
        )
      );
    } catch (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: error.message || "Unable to reach the chat service.",
                pending: false,
              }
            : message
        )
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <View style={styles.header}>
          <Text style={styles.title}>Pwnshop Assist</Text>
          <Text style={styles.subtitle}>Ask anything about products, deals, or your orders.</Text>
        </View>

        <View style={styles.contextRow}>
          <View style={styles.contextPill}><Text style={styles.contextText}>Deals context</Text></View>
          <View style={styles.contextPill}><Text style={styles.contextText}>Cart context</Text></View>
          <View style={styles.contextPill}><Text style={styles.contextText}>Seller context</Text></View>
        </View>

        <View style={styles.quickWrap}>
          {QUICK_PROMPTS.map((item) => (
            <TouchableOpacity key={item} onPress={() => submitMessage(item)} style={styles.quickChip}>
              <Text style={styles.quickChipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          ref={listRef}
          style={styles.messageListContainer}
          contentContainerStyle={styles.messageList}
          data={messages}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
          ListFooterComponent={<View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const isAssistant = item.role === "assistant";
            const useWebView = isAssistant && !item.pending && item.html;
            return (
              <View style={[
                styles.messageBubble,
                isAssistant ? styles.assistantBubble : styles.userBubble,
                useWebView && styles.assistantBubbleWebView,
              ]}>
                {useWebView ? (
                  <HtmlBubble html={item.html} />
                ) : (
                  <Text style={[
                    styles.messageText,
                    isAssistant ? styles.assistantText : styles.userText,
                    item.pending && styles.pendingText,
                  ]}>
                    {item.content}
                  </Text>
                )}
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <TextInput
            placeholder="Ask Pwnshop Assist..."
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => submitMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity disabled={sending} onPress={() => submitMessage()} style={styles.sendButton}>
            <Ionicons color="#fff" name="send" size={16} />
          </TouchableOpacity>
        </View>
      </View>
      {insets.bottom > 0 && <View style={{ backgroundColor: COLORS.card, height: insets.bottom }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.background, flex: 1 },
  header: {
    backgroundColor: COLORS.primary,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 54,
  },
  title: { color: "#fff", fontFamily: "Syne_700Bold", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#E9DDF8", marginTop: 4 },
  contextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  contextPill: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contextText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  quickWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  quickChip: {
    backgroundColor: "#EFE4F8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChipText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  messageListContainer: {
    flex: 1,
  },
  messageList: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    borderRadius: 14,
    marginBottom: 10,
    maxWidth: "88%",
    padding: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.accent,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderWidth: 1,
  },
  assistantBubbleWebView: {
    padding: 0,
    overflow: "hidden",
    width: "88%",
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: "#fff" },
  assistantText: { color: COLORS.text },
  pendingText: { fontStyle: "italic", opacity: 0.75 },
  composer: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.borderGray,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
});