import { useAuth } from "@clerk/expo";
import { Link, Tabs, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { TabIcon } from "@/components/TabIcon";
import { apiFetch } from "@/lib/api";
import { getCached, setCached } from "@/lib/cache";
import { registerForPushNotificationsAsync } from "@/lib/push-notifications";
import { requestTrackingConsent } from "@/lib/tracking-consent";

type CreditsResponse = { credits: number; vencimiento: string | null; perfilCompleto: boolean };

/** Insignia de créditos disponibles — vive en el header para que se vea
 * desde cualquier pestaña sin tener que entrar a Perfil a buscarla. Toca
 * para ir directo a Perfil, donde está el detalle (vencimiento, plan). */
function CreditsBadge({ credits }: { credits: number | null }) {
  const router = useRouter();
  if (credits === null) return null;
  return (
    <Pressable
      onPress={() => router.push("/(tabs)/perfil")}
      hitSlop={10}
      style={headerStyles.creditsBadge}
    >
      <Text style={headerStyles.creditsBadgeText}>
        {credits} {credits === 1 ? "crédito" : "créditos"}
      </Text>
    </Pressable>
  );
}

const headerStyles = StyleSheet.create({
  creditsBadge: {
    marginLeft: 16,
    backgroundColor: "#ff4f3f1a",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  creditsBadgeText: { fontSize: 12.5, fontWeight: "700", color: "#ff4f3f" },
});

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
  const [credits, setCredits] = useState<number | null>(
    getCached<{ credits: CreditsResponse }>("perfil")?.credits.credits ?? null
  );

  // Vuelve a pedir el saldo cada vez que se regresa a las pestañas (ej. al
  // canjear un regalo o un cupón en /canjear, que vive fuera de este grupo
  // de rutas) — sin esto, la insignia del header se quedaba con el número
  // de créditos de cuando se abrió la app, aunque el saldo real ya hubiera
  // cambiado.
  useFocusEffect(
    useCallback(() => {
      if (!isLoaded || !isSignedIn) return;
      (async () => {
        try {
          const token = await getToken();
          const credits = await apiFetch<CreditsResponse>("/me/credits", token);
          setCredits(credits.credits);
        } catch {
          // si falla, se queda con el número que ya tenía
        }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn])
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const credits = await apiFetch<CreditsResponse>("/me/credits", token);
        setCredits(credits.credits);
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
        // Por defecto, cualquier pestaña muestra cuántos créditos quedan, a
        // la izquierda del título (que React Navigation centra solo).
        headerLeft: () => <CreditsBadge credits={credits} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Gimnasios",
          tabBarIcon: ({ color }) => <TabIcon name="gimnasios" color={color} />,
          headerLeft: () => <CreditsBadge credits={credits} />,
          // Acceso directo a "Cómo funciona" desde la primera pantalla que ve
          // cualquiera — antes esa pantalla existía pero solo se llegaba por
          // un link suelto dentro de "Nosotros", así que casi nadie la veía.
          headerRight: () => (
            <Link href="/como-funciona" asChild>
              <Pressable hitSlop={10} style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#063009" }}>
                  ¿Cómo funciona?
                </Text>
              </Pressable>
            </Link>
          ),
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
