import { request } from "./http";
import { getSession } from "../storage/insecure";

async function userId() {
  const { user } = await getSession();
  return user?.id || null;
}

export async function getWishlist() {
  const id = await userId();
  if (!id) return { ok: false, data: [], error: "Not authenticated" };
  try {
    const data = await request(`/api/wishlist?userId=${id}`);
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, data: [], error: e.message };
  }
}

export async function addToWishlist(productId) {
  const id = await userId();
  if (!id) return { ok: false, error: "Not authenticated" };
  try {
    const data = await request("/api/wishlist", {
      method: "POST",
      body: { userId: id, productId },
    });
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function removeFromWishlist(productId) {
  const id = await userId();
  if (!id) return { ok: false, error: "Not authenticated" };
  try {
    const data = await request(`/api/wishlist/${productId}?userId=${id}`, {
      method: "DELETE",
    });
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
