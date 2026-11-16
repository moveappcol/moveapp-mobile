import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CREDIT_PLANS, esBlackFriday, creditosCompraPlan } from "@/lib/credits-pricing";

/** Banner de Black Friday arriba del inicio y de Planes — solo el 20 y 21
 * de nov (ver BLACK_FRIDAY). Se evalúa con la hora del celular cada vez que
 * se pinta la pantalla, así que aparece y desaparece solo. */
export default function BlackFridayBanner() {
  if (!esBlackFriday()) return null;
  const starter = CREDIT_PLANS[0];

  return (
    <View style={styles.banner}>
      <View style={styles.ribbon}>
        <Text style={styles.ribbonText}>BLACK FRIDAY</Text>
      </View>
      <Text style={styles.balloons}>🎈🎈</Text>

      <Text style={styles.kicker}>SOLO 20 Y 21 DE NOVIEMBRE</Text>
      <Text style={styles.title}>
        Aprovecha esta oferta: <Text style={styles.coral}>ocurre una vez al año</Text>
      </Text>
      <View style={styles.pill}>
        <Text style={styles.pillText}>
          Starter: +20% créditos ({starter.credits} → {creditosCompraPlan(starter)})
        </Text>
      </View>
      <View style={[styles.pill, styles.pillSoft]}>
        <Text style={styles.pillText}>Balance y Volume: +15% créditos</Text>
      </View>
      <Link href="/planes" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Quiero mis créditos extra</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#063009",
    borderRadius: 20,
    paddingTop: 44,
    paddingBottom: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
    overflow: "hidden",
    alignItems: "center",
  },
  ribbon: {
    position: "absolute",
    top: 18,
    left: -42,
    width: 170,
    backgroundColor: "#FF4F3F",
    paddingVertical: 4,
    transform: [{ rotate: "-35deg" }],
  },
  ribbonText: { color: "#fff", fontWeight: "900", fontSize: 11, textAlign: "center", letterSpacing: 1 },
  balloons: { position: "absolute", top: 6, right: 10, fontSize: 26 },
  kicker: { color: "#D4FF3F", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  title: { color: "#fff", fontSize: 19, fontWeight: "900", textAlign: "center", marginTop: 6, marginBottom: 12 },
  coral: { color: "#FF4F3F" },
  pill: { backgroundColor: "#FF4F3F", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 6 },
  pillSoft: { backgroundColor: "#ffffff1f" },
  pillText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  cta: { backgroundColor: "#D4FF3F", borderRadius: 999, paddingVertical: 10, paddingHorizontal: 20, marginTop: 8 },
  ctaText: { color: "#063009", fontWeight: "900", fontSize: 14 },
});
