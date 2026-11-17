import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { esNavidad } from "@/lib/credits-pricing";

/** Tarjeta de Navidad (23 nov – 31 dic) arriba de Inicio y Planes: invita a
 * regalar UNIQUE. Llena de regalos y moños; desaparece sola el 1 de enero. */
export default function NavidadCard() {
  if (!esNavidad()) return null;

  return (
    <View style={styles.card}>
      <Text style={[styles.deco, { top: 8, left: 12, fontSize: 26, transform: [{ rotate: "-12deg" }] }]}>🎁</Text>
      <Text style={[styles.deco, { top: 4, right: 14, fontSize: 30, transform: [{ rotate: "10deg" }] }]}>🎀</Text>
      <Text style={[styles.deco, { bottom: 10, left: 10, fontSize: 22 }]}>🎄</Text>
      <Text style={[styles.deco, { bottom: 8, right: 12, fontSize: 28, transform: [{ rotate: "8deg" }] }]}>🎁</Text>
      <Text style={[styles.deco, { top: 48, right: 40, fontSize: 14, opacity: 0.6 }]}>✨</Text>
      <Text style={[styles.deco, { top: 54, left: 44, fontSize: 12, opacity: 0.6 }]}>❄️</Text>

      <Text style={styles.kicker}>NAVIDAD UNIQUE</Text>
      <Text style={styles.title}>
        Esta Navidad, regala <Text style={styles.lime}>UNIQUE</Text>
      </Text>
      <Text style={styles.body}>1, 2 o 3 meses de clases y experiencias.{"\n"}Virtual al correo o física en Bogotá.</Text>
      <Link href="/regalar/plan-starter" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Regalar UNIQUE 🎁</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#063009",
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  deco: { position: "absolute" },
  kicker: { color: "#FF4F3F", fontSize: 12, fontWeight: "900", letterSpacing: 2.5 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 6 },
  lime: { color: "#D4FF3F" },
  body: { color: "#ffffffbf", fontSize: 13.5, textAlign: "center", marginTop: 8, lineHeight: 19 },
  cta: { backgroundColor: "#D4FF3F", borderRadius: 999, paddingVertical: 11, paddingHorizontal: 22, marginTop: 14 },
  ctaText: { color: "#063009", fontWeight: "900", fontSize: 14 },
});
