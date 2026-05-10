import { request } from "./http";

export function getOrders(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request(`/api/orders${query}`);
}

export function getOrderById(id) {
  return request(`/api/orders/${id}`);
}

export function createOrder(payload) {
  return request("/api/orders", {
    method: "POST",
    body: payload,
  });
}