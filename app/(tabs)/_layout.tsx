import { useAuth } from "@clerk/expo";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { TabIcon } from "@/components/TabIcon";
import { apiFetch } from "@/lib/api";
import { setCached } from "@/lib/cache";
import { registerForPushNotificationsAsync } from "@/lib/push-notifications";
import { requestTrackingConsent } from "@/lib/tracking-consent";

type CreditsResponse = { credits: number; vencimiento: string | null; perfilCompleto: boolean };

/** Apenas se sabe que hay sesión iniciada, pedimos de una vez los datos que
 * usan las otras pestañas (Perfil, Planes, Mis Reservas) y los dejamos en
 * caché — así cuando el usuario las abre, casi siempre ya tienen datos
 * listos en vez de arrancar en blanco. Cada pestaña igual vuelve a pedir
 * su propia data al montarse (esto solo adelanta el primer viaje). */
function warmOtherTabsCache(token: string | null, credits: CreditsResponse) {
  apiFetch<unknown>("/me/plan", token)
    .then((plan) => {
      setCached("perfil", { credits, plan });
      const active =
        typeof plan === "object" &&
        plan !== null &&
        "hasSubscription" in plan &&
        (plan as { hasSubscription: boolean }).hasSubscription &&
        (plan as { estado?: string }).estado === "Activa";
      setCached("hasActivePlan", Boolean(active));
    })
    .catch(() => {});

  apiFetch<{ reservations: unknown[] }>("/me/reservas", token)
    .then((data) => setCached("reservas", data.reservations))
    .catch(() => {});
}

export default function TabsLayout() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const credits = await apiFetch<CreditsResponse>("/me/credits", token);
        warmOtherTabsCache(token, credits);
        requestTrackingConsent().then((granted) => {
          if (!granted) {
            apiFetch("/tracking-consent", token, { method: "POST", body: { granted: false } }).catch(
              () => {}
            );
          }
        });
        registerForPushNotificationsAsync().then((pushToken) => {
          if (pushToken) {
            apiFetch("/push-token", token, { method: "POST", body: { token: pushToken } }).catch(
              () => {}
            );
          }
        });
      } catch {
        // si falla la verificación, dejamos seguir — no bloqueamos por un error de red
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <Tabs
      initialRouteName="index"
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
