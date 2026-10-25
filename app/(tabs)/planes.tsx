import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CREDIT_PLANS, TRIAL_PLAN, formatCOP } from "@/lib/credits-pricing";

export default function PlanesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Planes</Text>
      <Text style={styles.subtitle}>Elige tu plan mensual de créditos.</Text>

      <View style={styles.trialCard}>
        <Text style={styles.trialTitle}>¿No estás seguro todavía?</Text>
        <Text style={styles.trialBody}>
          Prueba 1 semana por {formatCOP(TRIAL_PLAN.price)} — {TRIAL_PLAN.credits} créditos. Si no
          cancelas, se activa tu plan Starter automáticamente.
        </Text>
        <Link href="/prueba" asChild>
          <Pressable style={styles.trialButton}>
            <Text style={styles.buttonText}>Empezar mi prueba</Text>
          </Pressable>
        </Link>
      </View>

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

      <View style={styles.sueltosCard}>
        <Text style={styles.sueltosTitle}>¿Quieres solo un crédito puntual?</Text>
        <Text style={styles.sueltosBody}>
          Compra créditos sueltos sin plan, para esa clase o experiencia que quieres probar.
        </Text>
        <Link href="/creditos-sueltos" asChild>
          <Pressable style={styles.sueltosButton}>
            <Text style={styles.sueltosButtonText}>Comprar créditos sueltos</Text>
          </Pressable>
        </Link>
      </View>

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
  trialCard: {
    borderWidth: 1,
    borderColor: "#ff4f3f",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  trialTitle: { fontSize: 16, fontWeight: "800", color: "#063009" },
  trialBody: { fontSize: 13, color: "#06300999", marginTop: 4, lineHeight: 18 },
  trialButton: {
    marginTop: 12,
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
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
  sueltosCard: {
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  sueltosTitle: { fontSize: 16, fontWeight: "800", color: "#063009" },
  sueltosBody: { fontSize: 13, color: "#06300999", marginTop: 4, lineHeight: 18 },
  sueltosButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#063009",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  sueltosButtonText: { color: "#063009", fontSize: 14, fontWeight: "700" },
  disclaimer: { fontSize: 12, color: "#06300999", marginTop: 24, lineHeight: 18 },
});
