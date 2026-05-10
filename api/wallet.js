import { request } from "./http";

export function getWalletBalance(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request(`/api/wallet/balance${query}`);
}

export function getWalletHistory(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request(`/api/wallet/history${query}`);
}

export function fundWallet(payload) {
  return request("/api/wallet/fund", {
    method: "POST",
    body: payload,
  });
}

export function payWithVulnBank(payload) {
  return request("/api/wallet/pay-vulnbank", {
    method: "POST",
    body: payload,
  });
}

export function claimWelcomeBonus(payload) {
  return request("/api/wallet/bonus", {
    method: "POST",
    body: payload,
  });
}
