import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CREDIT_PLANS, formatCOP } from "@/lib/credits-pricing";

export default function PlanesScreen() {
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

      <Link href="/creditos-sueltos" asChild>
        <Pressable style={styles.canjearLink}>
          <Text style={styles.canjearLinkText}>
            ¿Solo quieres probar algo puntual? Compra créditos sueltos →
          </Text>
        </Pressable>
      </Link>

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
  disclaimer: { fontSize: 12, color: "#06300999", marginTop: 24, lineHeight: 18 },
});
