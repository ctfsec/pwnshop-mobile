import { request } from "./http";

export function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function register(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function applySeller(payload) {
  return request("/api/sellers/apply", {
    method: "POST",
    body: payload,
  });
}

export function forgotPassword(payload) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
}

export function resetPassword(payload) {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}