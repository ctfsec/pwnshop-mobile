import { request } from "./http";

export function getAdminDashboard() {
  return request("/api/admin/dashboard");
}

export function resetAdminLab(payload = {}) {
  return request("/api/admin/lab/reset", {
    method: "POST",
    body: payload,
  });
}

export function getAdminUsers() {
  return request("/api/admin/users");
}

export function updateAdminUser(id, payload) {
  return request(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function getAdminOrders() {
  return request("/api/admin/orders");
}

export function updateAdminOrderStatus(id, payload) {
  return request(`/api/admin/orders/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
}

export function getAdminProducts() {
  return request("/api/admin/products");
}

export function deleteAdminProduct(id) {
  return request(`/api/admin/products/${id}`, {
    method: "DELETE",
  });
}

export function getAdminSellers() {
  return request("/api/admin/sellers");
}

export function updateAdminSeller(id, payload) {
  return request(`/api/admin/sellers/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function getAdminCoupons() {
  return request("/api/admin/coupons");
}

export function createAdminCoupon(payload) {
  return request("/api/admin/coupons", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminCoupon(id, payload) {
  return request(`/api/admin/coupons/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function getAdminActivityLogs() {
  return request("/api/admin/activity-logs");
}

export function getAdminChatLogs() {
  return request("/api/admin/chat-logs");
}

export function getAdminRevenueReport() {
  return request("/api/admin/revenue-report");
}

export function getAdminVulnBankTransactions() {
  return request("/api/admin/vulnbank-transactions");
}

export function getAdminSecurityLogs() {
  return request("/api/admin/security-logs");
}

export function getAdminNotifications() {
  return request("/api/admin/notifications");
}

export function sendAdminNotification(payload) {
  return request("/api/notifications/send", { method: "POST", body: payload });
}

export function broadcastAdminNotification(payload) {
  return request("/api/admin/notifications/send-all", { method: "POST", body: payload });
}

export function updateAdminProduct(id, payload) {
  return request(`/api/admin/products/${id}`, { method: "PATCH", body: payload });
}
