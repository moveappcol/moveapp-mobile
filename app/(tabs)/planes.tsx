import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CREDIT_PLANS, formatCOP } from "@/lib/credits-pricing";

export default function PlanesScreen() {
  return (
    <View style={styles.container}>
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
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
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
});
