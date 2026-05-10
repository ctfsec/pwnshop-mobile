import { useEffect } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";

// PWN-M023: Insecure deep link handling
// This vulnerability demonstrates improper deep link validation and routing.
// Issues:
// 1. Deep link parameters are not validated
// 2. No origin verification (autoVerify: false in app.json)
// 3. Parameters are used directly without sanitization
// 4. No auth checks before routing to sensitive screens

export function useDeepLinks() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      try {
        const route = url.replace(/.*?:\/\//g, ""); // Remove scheme
        const routeName = route.split("?")[0];
        const params = new URLSearchParams(route.split("?")[1]);

        // Vulnerable: No validation of parameters
        const userId = params.get("userId") || params.get("id");
        const orderId = params.get("orderId");
        const action = params.get("action");

        // Route based on host without proper security checks
        if (routeName === "admin") {
          // Vulnerable: Direct navigation to admin without auth
          router.push("/admin/access");
        } else if (routeName === "wallet") {
          // Vulnerable: Direct navigation to wallet
          router.push("/wallet");
        } else if (routeName === "checkout") {
          // Vulnerable: Direct navigation to checkout
          router.push("/(tabs)/cart");
        } else if (routeName === "user/profile" && userId) {
          // Vulnerable: Using unsanitized userId from deep link
          router.push(`/profile?userId=${userId}`);
        } else if (routeName === "order/track" && orderId) {
          // Vulnerable: Direct access to order tracking with arbitrary orderId
          router.push(`/tracking/${orderId}`);
        } else if (routeName === "action" && action) {
          // Vulnerable: Executing arbitrary actions from deep link
          if (action === "logout") {
            // Could be exploited to force logout
            console.warn("Logout action triggered via deep link");
          }
        }
      } catch (error) {
        console.error("Deep link error:", error);
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if app was opened from a deep link
    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url != null) {
        handleDeepLink({ url });
      }
    };

    handleInitialUrl();

    return () => {
      subscription?.remove();
    };
  }, [router]);
}

// Deep link examples that exploit the vulnerabilities:
// pwnshop://admin - Direct admin access
// pwnshop://wallet - Direct wallet access
// pwnshop://order/track?orderId=o1 - View any order
// pwnshop://user/profile?userId=u3 - View any user profile
// pwnshop://action?action=logout - Force logout
