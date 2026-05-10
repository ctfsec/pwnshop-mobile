import { Tabs } from "expo-router";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { View, Text, StyleSheet } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getSession } from "../../storage/insecure";
import { useCart } from "../context/CartContext";

function CartBadge() {
  const { items } = useCart();
  const count = items.reduce((total, item) => total + (item.qty || 1), 0);

  if (!count) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const [role, setRole] = useState("buyer");
  const [enrollmentStatus, setEnrollmentStatus] = useState("unapproved");

  useEffect(() => {
    let mounted = true;
    getSession().then(({ user }) => {
      if (mounted && user) {
        setRole(user.role || "buyer");
        setEnrollmentStatus(user.sellerEnrollmentStatus || "unapproved");
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSession().then(({ user }) => {
        if (active && user) {
          setRole(user.role || "buyer");
          setEnrollmentStatus(user.sellerEnrollmentStatus || "unapproved");
        }
      });

      return () => {
        active = false;
      };
    }, [])
  );

  const showSellerTab = (role === "seller" || role === "admin") && enrollmentStatus === "approved";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.borderGray,
          height: 66,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home" size={size} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: "Deals",
          tabBarIcon: ({ color, size }) => <FontAwesome6 color={color} name="tags" size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons color={color} name="cart" size={size} />
              <CartBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="wishlist" options={{ href: null }} />
      {/* Wishlist moved out of main tabs into More/Profile quick links to avoid crowding tabs */}
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="grid" size={size} />,
        }}
      />
      <Tabs.Screen
        name="seller"
        options={
          showSellerTab
            ? {
                title: "Seller",
                tabBarIcon: ({ color, size }) => <Ionicons color={color} name="storefront" size={size} />,
              }
            : { href: null }
        }
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    height: 16,
    justifyContent: "center",
    position: "absolute",
    right: -8,
    top: -4,
    width: 16,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});