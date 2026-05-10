import { Stack } from "expo-router";
import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
import { hasAdminAccess } from "../../../storage/insecure";

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    hasAdminAccess().then((allowed) => {
      if (!mounted) {
        return;
      }

      if (!allowed && pathname !== "/admin/access") {
        router.replace("/admin/access");
      }
    });

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
