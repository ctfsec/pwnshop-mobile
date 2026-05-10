import { CONFIG } from "./config";
const BASE_URL = CONFIG.BASE_URL;
import { getSession } from "../storage/insecure";

// NOTE: The real `expo-notifications` native module may not be installed in
// this environment. To avoid Metro failing to resolve the native package,
// provide a safe fallback implementation that uses the backend endpoints
// where possible and returns informative errors for client-only features.

export async function registerForPushNotifications() {
  return { ok: false, error: "expo-notifications not installed in this environment" };
}

export async function getPushToken() {
  return { ok: false, error: "expo-notifications not installed in this environment" };
}

export async function savePushToken() {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Simulate a push token for the training environment.
  // In a real build with expo-notifications installed this would use a real device token.
  const simulatedToken = `ExponentPushToken[pwnshop-sim-${user.id}]`;

  try {
    const response = await fetch(`${BASE_URL}/api/notifications/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, token: simulatedToken }),
    });
    const json = await response.json();
    return { ok: response.ok, ...json };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, body, data }),
    });

    const json = await response.json();
    return { ok: response.ok, ...json };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function getPushNotifications() {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Not authenticated" };

  try {
    const response = await fetch(`${BASE_URL}/api/notifications?userId=${user.id}`);
    const json = await response.json();
    return { ok: response.ok, ...json };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function addPushNotificationListener() {
  // Notifications aren't available; provide no-op unsubscribe handles.
  return {
    subscription: { remove: () => {} },
    responseSubscription: { remove: () => {} },
  };
}
