import { useAuth } from "@clerk/expo";
import { Link, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import {
  CARGO_OPERATIVO_CREDITOS_SUELTOS,
  CARGO_OPERATIVO_UMBRAL_CREDITOS,
  PRECIO_CREDITO_SUELTO,
  formatCOP,
  precioCreditosSueltos,
} from "@/lib/credits-pricing";
import { tokenizeCard } from "@/lib/wompi";

type Config = { wompiPublicKey: string; permalinkAcceptance: string; permalinkPersonalAuth: string };
type BuyResult = { ok: true; credits: number } | { ok: false; error: string; pending?: boolean };

/** Compra de créditos sueltos, sin plan — para quien solo quiere probar una
 * clase o experiencia puntual (ver chargeCreditosSueltos en el backend).
 * A diferencia de planes/[id].tsx, no hay plan ni cupón: solo una cantidad
 * y una tarjeta. */
export default function CreditosSueltosScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const [cantidad, setCantidad] = useState(1);
  const precio = precioCreditosSueltos(cantidad);

  const [number, setNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<Config>("/config")
      .then(setConfig)
      .catch(() => setConfigError("No pudimos conectar con la pasarela de pagos."));
  }, []);

  useEffect(() => {
    if (success === null) return;
    const timeout = setTimeout(() => router.replace("/perfil"), 1800);
    return () => clearTimeout(timeout);
  }, [success, router]);

  function ajustarCantidad(delta: number) {
    setCantidad((prev) => Math.max(1, prev + delta));
  }

  async function handleSubmit() {
    setError(null);
    if (!accepted) {
      setError("Debes aceptar los términos y el tratamiento de datos.");
      return;
    }
    if (!config) {
      setError("La pasarela de pagos todavía no está lista, intenta de nuevo.");
      return;
    }

    setSubmitting(true);
    try {
      const cardToken = await tokenizeCard({
        publicKey: config.wompiPublicKey,
        number,
        cvc,
        expMonth,
        expYear,
        cardHolder,
      });

      const token = await getToken();
      const result = await apiFetch<BuyResult>("/creditos/sueltos", token, {
        method: "POST",
        body: { cantidad, cardToken },
      });

      if (result.ok) {
        setSuccess(result.credits);
      } else if (result.pending) {
        setError("Tu pago está siendo procesado. Te avisaremos apenas se confirme.");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos procesar el pago.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Créditos sueltos", headerLeft: () => <BackButton /> }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Créditos sueltos</Text>
        <Text style={styles.subtitle}>
          {formatCOP(PRECIO_CREDITO_SUELTO)} por crédito, sin plan — ideal para probar una clase o
          experiencia puntual. Vencen al mes de comprarlos.
        </Text>

        {!isLoaded ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : !isSignedIn ? (
          <View style={styles.guestBox}>
            <Text style={styles.subtitle}>Inicia sesión para comprar créditos.</Text>
            <Link href="/sign-in" asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              </Pressable>
            </Link>
          </View>
        ) : success !== null ? (
          <Text style={styles.successText}>¡Listo! Ya tienes {success} créditos disponibles.</Text>
        ) : (
          <View style={styles.form}>
            {configError && <Text style={styles.errorText}>{configError}</Text>}

            <Text style={styles.label}>¿Cuántos créditos quieres?</Text>
            <View style={styles.cantidadRow}>
              <Pressable
                onPress={() => ajustarCantidad(-1)}
                disabled={cantidad <= 1}
                style={[styles.stepperButton, cantidad <= 1 && styles.buttonDisabled]}
              >
                <Text style={styles.stepperButtonText}>−</Text>
              </Pressable>
              <Text style={styles.cantidadText}>{cantidad}</Text>
              <Pressable onPress={() => ajustarCantidad(1)} style={styles.stepperButton}>
                <Text style={styles.stepperButtonText}>+</Text>
              </Pressable>
              <Text style={styles.totalText}>Total: {formatCOP(precio)}</Text>
            </View>

            {cantidad < CARGO_OPERATIVO_UMBRAL_CREDITOS && (
              <Text style={styles.nota}>
                Las compras de 1-2 créditos incluyen un cargo operativo de{" "}
                {formatCOP(CARGO_OPERATIVO_CREDITOS_SUELTOS)} (cubre el costo fijo de procesar pagos
                chicos).
              </Text>
            )}

            <Text style={styles.label}>Número de tarjeta</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="4242 4242 4242 4242"
              placeholderTextColor="#06300966"
              value={number}
              onChangeText={setNumber}
            />

            <Text style={styles.label}>Nombre en la tarjeta</Text>
            <TextInput style={styles.input} value={cardHolder} onChangeText={setCardHolder} />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Mes</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor="#06300966"
                  value={expMonth}
                  onChangeText={setExpMonth}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Año</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="AA"
                  placeholderTextColor="#06300966"
                  value={expYear}
                  onChangeText={setExpYear}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>CVC</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={cvc}
                  onChangeText={setCvc}
                />
              </View>
            </View>

            <View style={styles.acceptRow}>
              <Switch value={accepted} onValueChange={setAccepted} />
              <Text style={styles.acceptText}>
                Acepto los términos y condiciones y la autorización de tratamiento de datos de
                Wompi.
                {config && (
                  <Text style={styles.linkText}>
                    {"\n"}
                    <Text onPress={() => Linking.openURL(config.permalinkAcceptance)}>
                      Ver términos
                    </Text>
                    {"  ·  "}
                    <Text onPress={() => Linking.openURL(config.permalinkPersonalAuth)}>
                      Ver tratamiento de datos
                    </Text>
                  </Text>
                )}
              </Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              disabled={submitting || !config}
              onPress={handleSubmit}
              style={[styles.button, (submitting || !config) && styles.buttonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Comprar — {formatCOP(precio)}</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", color: "#063009" },
  subtitle: { fontSize: 14, color: "#06300999", marginTop: 6 },
  guestBox: { marginTop: 24, width: "100%" },
  form: { marginTop: 24 },
  label: { fontSize: 13, fontWeight: "600", color: "#063009" },
  input: {
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#063009",
  },
  row: { flexDirection: "row", gap: 10 },
  rowItem: { flex: 1 },
  cantidadRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8, marginBottom: 8 },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#06300933",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: { fontSize: 20, fontWeight: "700", color: "#063009" },
  cantidadText: { fontSize: 18, fontWeight: "800", color: "#063009", width: 32, textAlign: "center" },
  totalText: { fontSize: 16, fontWeight: "800", color: "#ff4f3f" },
  nota: { fontSize: 12, color: "#06300999", marginBottom: 14 },
  acceptRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4, marginBottom: 16 },
  acceptText: { flex: 1, fontSize: 12.5, color: "#063009" },
  linkText: { color: "#ff4f3f", fontWeight: "600" },
  errorText: { color: "#ff4f3f", fontSize: 13, marginTop: 4, marginBottom: 8 },
  successText: { marginTop: 24, fontSize: 15, fontWeight: "600", color: "#0a8a3f", textAlign: "center" },
  button: {
    marginTop: 8,
    width: "100%",
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
