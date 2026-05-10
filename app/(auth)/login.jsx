import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import Wordmark from "../../components/ui/wordmark";
import { login as loginRequest } from "../../api/auth";
import { saveSession } from "../../storage/insecure";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    setError("");
    setLoading(true);

    try {
      const response = await loginRequest({
        email: identifier,
        password,
      });

      if (response.user?.twoFAEnabled) {
        router.replace({
          pathname: "/2fa/challenge",
          params: {
            userId: response.user.id,
            token: response.token,
            user: JSON.stringify(response.user),
          },
        });
      } else {
        await saveSession({ token: response.token, user: response.user });
        router.replace("/(tabs)");
      }
    } catch (authError) {
      setError(authError.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Wordmark />
      <Text style={styles.title}>Login</Text>

      <TouchableOpacity style={styles.socialBtn}>
        <Text style={styles.socialText}>Login with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialBtn}>
        <Text style={styles.socialText}>Login with Apple</Text>
      </TouchableOpacity>

      <Text style={styles.divider}>OR</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor={COLORS.muted}
        value={identifier}
        onChangeText={setIdentifier}
      />

      <View style={styles.passwordWrap}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor={COLORS.muted}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
          <Text style={styles.showHide}>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <Text style={styles.helper}>Don't have an Account?</Text>
      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <View style={styles.outlineAction}>
          <Text style={styles.outlineActionText}>Create an Account</Text>
        </View>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: COLORS.text,
    fontFamily: "Syne_700Bold",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 10,
    textAlign: "center",
  },
  socialBtn: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.secondary,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 10,
    paddingVertical: 12,
  },
  socialText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  divider: {
    color: COLORS.muted,
    marginVertical: 12,
    textAlign: "center",
  },
  input: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  passwordWrap: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderGray,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
  },
  showHide: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  forgot: {
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 14,
    textAlign: "right",
  },
  button: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 13,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  error: {
    color: "#B00020",
    marginBottom: 10,
    textAlign: "center",
  },
  helper: {
    color: COLORS.muted,
    marginTop: 14,
    textAlign: "center",
  },
  outlineAction: {
    alignItems: "center",
    borderColor: COLORS.primary,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    paddingVertical: 12,
  },
  outlineActionText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  todo: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 14,
    textAlign: "center",
  },
});
