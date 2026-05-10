import { request } from "./http";

export function validateCoupon(payload) {
  return request("/api/coupons/validate", {
    method: "POST",
    body: payload,
  });
}
