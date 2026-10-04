import { useAuth } from "@clerk/expo";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";
import { getCached, setCached } from "@/lib/cache";
import { CREDIT_PLANS, CREDIT_TOPUPS, formatCOP } from "@/lib/credits-pricing";

const CACHE_KEY = "hasActivePlan";

type PlanResponse =
  | { hasSubscription: false }
  | { hasSubscription: true; estado: string; plan: unknown; proximoCobro: string | null; planSiguiente: unknown };

export default function PlanesScreen() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [hasActivePlan, setHasActivePlan] = useState(() => getCached<boolean>(CACHE_KEY) ?? false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const plan = await apiFetch<PlanResponse>("/me/plan", token);
        const active = plan.hasSubscription && plan.estado === "Activa";
        setCached(CACHE_KEY, active);
        setHasActivePlan(active);
      } catch {
        // dejamos el valor en caché (o false) tal como estaba
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Planes</Text>
      <Text style={styles.subtitle}>Elige tu plan mensual de créditos.</Text>

      {CREDIT_PLANS.map((plan) => (
        <View key={plan.id} style={styles.card}>
          <Text style={styles.cardTitle}>{plan.name}</Text>
          <Text style={styles.cardSubtitle}>{plan.label}</Text>
          <Text style={styles.price}>{formatCOP(plan.price)}/mes</Text>
          <Link href={`/planes/${plan.id}`} asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Suscribirme</Text>
            </Pressable>
          </Link>
          <Link href={`/regalar/${plan.id}`} asChild>
            <Pressable style={styles.giftLink}>
              <Text style={styles.giftLinkText}>Regalar este plan 🎁</Text>
            </Pressable>
          </Link>
        </View>
      ))}

      <Link href="/canjear" asChild>
        <Pressable style={styles.canjearLink}>
          <Text style={styles.canjearLinkText}>¿Te regalaron un plan? Canjéalo aquí →</Text>
        </Pressable>
      </Link>

      {hasActivePlan && (
        <View style={styles.topupsSection}>
          <Text style={styles.topupsTitle}>Créditos adicionales</Text>
          <Text style={styles.subtitle}>
            ¿Se te acabaron los créditos antes de fin de mes? Suma más sin esperar a tu próximo
            ciclo.
          </Text>

          <View style={styles.topupsList}>
            {CREDIT_TOPUPS.map((topup) => (
              <Link key={topup.id} href={`/creditos/${topup.id}`} asChild>
                <Pressable style={styles.topupRow}>
                  <View>
                    <Text style={styles.topupLabel}>{topup.label}</Text>
                    <Text style={styles.topupPrice}>{formatCOP(topup.price)}</Text>
                  </View>
                  <Text style={styles.topupButtonText}>Comprar</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.disclaimer}>
        Puedes cancelar las clases hasta 24h antes sin costo. Para promover la diversidad de la
        red, puedes acceder a cada gimnasio un máximo de 3 veces al mes.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", color: "#063009" },
  subtitle: { fontSize: 14, color: "#06300999", marginTop: 4, marginBottom: 20 },
  card: {
    backgroundColor: "#063009",
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ff4f3f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardSubtitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 4 },
  price: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 10 },
  button: {
    marginTop: 16,
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  giftLink: { marginTop: 10, alignItems: "center" },
  giftLinkText: { color: "#ffffffb3", fontSize: 12.5, fontWeight: "700" },
  canjearLink: {
    marginTop: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  canjearLinkText: { fontSize: 13, fontWeight: "700", color: "#063009" },
  topupsSection: { marginTop: 12 },
  topupsTitle: { fontSize: 18, fontWeight: "700", color: "#063009" },
  topupsList: { marginTop: 16, gap: 10 },
  topupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  topupLabel: { fontSize: 14, fontWeight: "700", color: "#063009" },
  topupPrice: { fontSize: 13, fontWeight: "700", color: "#ff4f3f", marginTop: 2 },
  topupButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#063009",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  disclaimer: { fontSize: 12, color: "#06300999", marginTop: 24, lineHeight: 18 },
});
