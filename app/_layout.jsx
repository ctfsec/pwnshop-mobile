import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Syne_400Regular, Syne_700Bold, Syne_800ExtraBold } from "@expo-google-fonts/syne";
import { CartProvider } from "./context/CartContext";
import { useDeepLinks } from "../hooks/useDeepLinks";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Syne_400Regular,
    Syne_700Bold,
    Syne_800ExtraBold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        // ignore errors; app will still try to hide later
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    async function hide() {
      if (fontsLoaded) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // ignore
        }
      }
    }
    hide();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <CartProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </CartProvider>
  );
}
