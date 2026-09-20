import { Link } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

const QUIENES_SOMOS = [
  "Creemos que no existe una sola manera de entrenar. Por eso, a través de UNIQUE puedes explorar diferentes disciplinas en distintos gimnasios y estudios de la ciudad, hasta encontrar esa rutina que se adapta a TI.",
  "Con UNIQUE, tus créditos son tu llave. Los usas donde quieras, cuando quieras, y descubres experiencias de entrenamiento que antes solo veías desde afuera.",
  "No creemos en el entrenamiento único para todos. Creemos en la libertad de moverte a tu manera — y en construir, junto a los centros de entrenamiento que confían en nosotros, una forma más flexible, honesta y humana de cuidar tu bienestar.",
  "Esto apenas comienza. UNIQUE nace en Bogotá con la convicción de que el movimiento nos hace mejores personas, y con el compromiso de hacerlo accesible para más gente cada día.",
];

export default function NosotrosScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require("@/assets/unique-logo.png")} style={styles.logo} />

      <Text style={styles.eyebrow}>Sobre nosotros</Text>
      <Text style={styles.title}>UNIQUE — Quiénes somos</Text>

      <View style={styles.paragraphGroup}>
        {QUIENES_SOMOS.map((p) => (
          <Text key={p} style={styles.paragraph}>
            {p}
          </Text>
        ))}
      </View>

      <View style={styles.calloutBox}>
        <Text style={styles.calloutText}>
          ¿Quieres saber exactamente cómo funcionan los créditos, los planes y las reservas?{" "}
          <Link href="/como-funciona" style={styles.calloutLink}>
            Mira la guía completa de cómo funciona UNIQUE
          </Link>
          , con preguntas frecuentes incluidas.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  logo: { width: 56, height: 56, borderRadius: 14, marginBottom: 16 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#06300980",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#063009", marginTop: 6 },
  paragraphGroup: { marginTop: 16, gap: 12 },
  paragraph: { fontSize: 14, lineHeight: 21, color: "#063009cc" },
  calloutBox: {
    marginTop: 28,
    backgroundColor: "#0630090a",
    borderRadius: 20,
    padding: 18,
  },
  calloutText: { fontSize: 14, lineHeight: 21, color: "#063009cc" },
  calloutLink: { fontWeight: "700", color: "#ff4f3f", textDecorationLine: "underline" },
});
