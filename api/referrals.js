import { request } from "./http";

export function getMyReferral(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request(`/api/referrals/me${query}`);
}

export function redeemReferralCode(payload) {
  return request("/api/referrals/redeem", {
    method: "POST",
    body: payload,
  });
}