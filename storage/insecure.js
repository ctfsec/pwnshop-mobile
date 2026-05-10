import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const ADMIN_GATE_KEY = "admin_gate";
const SHIPPING_PREFS_KEY = "shipping_prefs";

export async function saveSession({ token, user }) {
	const tasks = [];

	if (token) {
		tasks.push(AsyncStorage.setItem(TOKEN_KEY, String(token)));
	}

	if (user) {
		tasks.push(AsyncStorage.setItem(USER_KEY, JSON.stringify(user)));
	}

	await Promise.all(tasks);
}

export async function getSession() {
	const [token, userRaw] = await Promise.all([
		AsyncStorage.getItem(TOKEN_KEY),
		AsyncStorage.getItem(USER_KEY),
	]);

	return {
		token,
		user: userRaw ? JSON.parse(userRaw) : null,
	};
}

export async function clearSession() {
	await Promise.all([
		AsyncStorage.removeItem(TOKEN_KEY),
		AsyncStorage.removeItem(USER_KEY),
		AsyncStorage.removeItem(ADMIN_GATE_KEY),
	]);
}

export async function grantAdminAccess(minutes = 30) {
	const expiresAt = Date.now() + Math.max(1, Number(minutes || 30)) * 60 * 1000;
	await AsyncStorage.setItem(ADMIN_GATE_KEY, JSON.stringify({ granted: true, expiresAt }));
}

export async function clearAdminAccess() {
	await AsyncStorage.removeItem(ADMIN_GATE_KEY);
}

export async function hasAdminAccess() {
	const raw = await AsyncStorage.getItem(ADMIN_GATE_KEY);
	if (!raw) return false;

	try {
		const parsed = JSON.parse(raw);
		if (!parsed?.granted || !parsed?.expiresAt) {
			return false;
		}
		if (Date.now() > Number(parsed.expiresAt)) {
			await clearAdminAccess();
			return false;
		}
		return true;
	} catch (error) {
		await clearAdminAccess();
		return false;
	}
}

export async function saveShippingPrefs(prefs) {
	const next = {
		defaultAddress: String(prefs?.defaultAddress || "").trim(),
		defaultShippingMethod: String(prefs?.defaultShippingMethod || "delivery_default"),
	};
	await AsyncStorage.setItem(SHIPPING_PREFS_KEY, JSON.stringify(next));
}

export async function getShippingPrefs() {
	const raw = await AsyncStorage.getItem(SHIPPING_PREFS_KEY);
	if (!raw) {
		return { defaultAddress: "", defaultShippingMethod: "delivery_default" };
	}

	try {
		const parsed = JSON.parse(raw);
		return {
			defaultAddress: String(parsed?.defaultAddress || ""),
			defaultShippingMethod: String(parsed?.defaultShippingMethod || "delivery_default"),
		};
	} catch (error) {
		return { defaultAddress: "", defaultShippingMethod: "delivery_default" };
	}
}

