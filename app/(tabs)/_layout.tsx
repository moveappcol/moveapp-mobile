import { useAuth } from "@clerk/expo";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { TabIcon } from "@/components/TabIcon";
import { apiFetch } from "@/lib/api";

export default function TabsLayout() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const credits = await apiFetch<{ perfilCompleto: boolean }>("/me/credits", token);
        if (!credits.perfilCompleto) {
          router.replace("/completar-perfil");
        }
      } catch {
        // si falla la verificación, dejamos seguir — no bloqueamos por un error de red
      }
    })();
  }, [isLoaded, isSignedIn, getToken, router]);

  return (
    <Tabs
      screenOptions={{
        headerTintColor: "#063009",
        tabBarActiveTintColor: "#ff4f3f",
        tabBarInactiveTintColor: "#06300999",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Gimnasios",
          tabBarIcon: ({ color }) => <TabIcon name="gimnasios" color={color} />,
        }}
      />
      <Tabs.Screen
        name="planes"
        options={{
          title: "Planes",
          tabBarIcon: ({ color }) => <TabIcon name="planes" color={color} />,
        }}
      />
      <Tabs.Screen
        name="nosotros"
        options={{
          title: "Nosotros",
          tabBarIcon: ({ color }) => <TabIcon name="nosotros" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: "Mis Reservas",
          tabBarIcon: ({ color }) => <TabIcon name="reservas" color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <TabIcon name="perfil" color={color} />,
        }}
      />
    </Tabs>
  );
}
