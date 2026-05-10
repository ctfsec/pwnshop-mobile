import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState(null);

  function addToCart(product) {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: (copy[idx].qty || 1) + (product.qty || 1) };
        return copy;
      }
      return [...prev, { ...product, qty: product.qty || 1 }];
    });
  }

  function removeFromCart(id) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function clearCart() {
    setItems([]);
    setCoupon(null);
  }

  function applyCoupon(nextCoupon) {
    setCoupon(nextCoupon || null);
  }

  function clearCoupon() {
    setCoupon(null);
  }

  return (
    <CartContext.Provider value={{ items, coupon, addToCart, removeFromCart, clearCart, applyCoupon, clearCoupon }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export default CartContext;
