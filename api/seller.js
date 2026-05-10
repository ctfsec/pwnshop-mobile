import { request } from "./http";

function sellerQuery(params = {}) {
  const query = new URLSearchParams(params).toString();
  return query ? `?${query}` : "";
}

export function getSellerDashboard(params = {}) {
  return request(`/api/seller/dashboard${sellerQuery(params)}`);
}

export function getSellerProducts(params = {}) {
  return request(`/api/seller/products${sellerQuery(params)}`);
}

export function createSellerProduct(payload) {
  return request("/api/seller/products", {
    method: "POST",
    body: payload,
  });
}

export function updateSellerProduct(id, payload) {
  return request(`/api/seller/products/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteSellerProduct(id) {
  return request(`/api/seller/products/${id}`, {
    method: "DELETE",
  });
}

export function getSellerSales(params = {}) {
  return request(`/api/seller/sales${sellerQuery(params)}`);
}

export function releaseSellerSale(orderId, payload) {
  return request(`/api/seller/sales/${orderId}/release`, {
    method: "POST",
    body: payload,
  });
}

export function getSellerWallet(params = {}) {
  return request(`/api/seller/wallet${sellerQuery(params)}`);
}

export function withdrawSellerWallet(payload) {
  return request("/api/seller/wallet/withdraw", {
    method: "POST",
    body: payload,
  });
}

export function applySellerApplication(payload) {
  return request("/api/seller/apply", {
    method: "POST",
    body: payload,
  });
}

export function getSellerAnalytics(params = {}) {
  return request(`/api/seller/analytics${sellerQuery(params)}`);
}

export function getSellerProfile(params = {}) {
  return request(`/api/seller/profile${sellerQuery(params)}`);
}

export function updateSellerProfile(payload) {
  return request("/api/seller/profile", { method: "PATCH", body: payload });
}
