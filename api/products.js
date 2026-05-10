import { request } from "./http";

export function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/products${query ? `?${query}` : ""}`);
}

// PWN-M007: routes to SQL endpoint — injectable via search term
export function searchProducts(term) {
  return request(`/api/products/search?q=${encodeURIComponent(term)}`);
}

export function getProductById(id) {
  return request(`/api/products/${id}`);
}

export function addProductReview(id, payload) {
  return request(`/api/products/${id}/reviews`, {
    method: "POST",
    body: payload,
  });
}