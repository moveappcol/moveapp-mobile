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
import { TRIAL_PLAN, STARTER_PLAN_PRICE, formatCOP } from "@/lib/credits-pricing";
import { tokenizeCard } from "@/lib/wompi";

type Config = { wompiPublicKey: string; permalinkAcceptance: string; permalinkPersonalAuth: string };
type EstadoPrueba = { elegible: boolean; errorElegibilidad: string | null; prueba: unknown };
type BuyResult = { ok: true; credits: number; fechaFin: string } | { ok: false; error: string; pending?: boolean };

const TEXTO_LEGAL =
  "Entiendo que al terminar mi semana de prueba se me cobrará automáticamente el plan Starter ($209.900/mes), salvo que cancele antes.";

/** Checkout de la Prueba UNIQUE de 1 semana — espejo de planes/[id].tsx,
 * pero con la casilla legal del cobro automático (sin marcar por defecto)
 * y el chequeo de elegibilidad antes de mostrar el formulario (ver
 * /api/mobile/prueba/estado). */
export default function PruebaScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoPrueba | null>(null);

  const [number, setNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [aceptaCobroAutomatico, setAceptaCobroAutomatico] = useState(false);
  const [codigoReferido, setCodigoReferido] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<Config>("/config")
      .then(setConfig)
      .catch(() => setConfigError("No pudimos conectar con la pasarela de pagos."));
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const result = await apiFetch<EstadoPrueba>("/prueba/estado", token);
        setEstado(result);
      } catch {
        // si falla, se deja sin estado — el formulario simplemente no sale
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (success === null) return;
    const timeout = setTimeout(() => router.replace("/perfil"), 1800);
    return () => clearTimeout(timeout);
  }, [success, router]);

  async function handleSubmit() {
    setError(null);
    if (!accepted) {
      setError("Debes aceptar los términos y el tratamiento de datos.");
      return;
    }
    if (!aceptaCobroAutomatico) {
      setError("Debes marcar la casilla para continuar.");
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
      const result = await apiFetch<BuyResult>("/prueba/comprar", token, {
        method: "POST",
        body: {
          cardToken,
          aceptado: aceptaCobroAutomatico,
          codigoReferido: codigoReferido.trim() || undefined,
        },
      });

      if (result.ok) {
        setSuccess(result.credits);
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
      <Stack.Screen options={{ headerShown: true, title: "Prueba UNIQUE", headerLeft: () => <BackButton /> }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Prueba UNIQUE — 1 semana</Text>
        <Text style={styles.subtitle}>
          {formatCOP(TRIAL_PLAN.price)} · {TRIAL_PLAN.credits} créditos, válidos por 7 días.
        </Text>

        {!isLoaded || !isSignedIn ? (
          <View style={styles.guestBox}>
            <Text style={styles.subtitle}>Inicia sesión para empezar tu prueba.</Text>
            <Link href="/sign-in" asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              </Pressable>
            </Link>
          </View>
        ) : estado && !estado.elegible ? (
          <View style={styles.guestBox}>
            <Text style={styles.title}>No eres elegible para la prueba</Text>
            <Text style={styles.subtitle}>{estado.errorElegibilidad ?? "La prueba es solo para nuevos usuarios."}</Text>
            <Link href="/(tabs)/planes" asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Ver planes</Text>
              </Pressable>
            </Link>
          </View>
        ) : success !== null ? (
          <Text style={styles.successText}>
            ¡Tu Prueba UNIQUE ya está activa! Ya tienes {success} créditos disponibles.
          </Text>
        ) : !estado ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.form}>
            {configError && <Text style={styles.errorText}>{configError}</Text>}

            <Text style={styles.resumenPago}>
              Pagas {formatCOP(TRIAL_PLAN.price)} hoy. En 7 días se activa tu plan Starter por{" "}
              {formatCOP(STARTER_PLAN_PRICE)}/mes si no cancelas.
            </Text>

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

            <Text style={styles.label}>¿Alguien te refirió? (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Código de referido"
              placeholderTextColor="#06300966"
              autoCapitalize="characters"
              value={codigoReferido}
              onChangeText={setCodigoReferido}
            />

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

            <View style={styles.legalRow}>
              <Switch value={aceptaCobroAutomatico} onValueChange={setAceptaCobroAutomatico} />
              <Text style={styles.legalText}>{TEXTO_LEGAL}</Text>
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
                <Text style={styles.buttonText}>Comprar — {formatCOP(TRIAL_PLAN.price)}</Text>
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
  resumenPago: { fontSize: 14, fontWeight: "700", color: "#063009", marginBottom: 16 },
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
  acceptRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4, marginBottom: 12 },
  acceptText: { flex: 1, fontSize: 12.5, color: "#063009" },
  legalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff4f3f55",
    backgroundColor: "#ff4f3f0d",
  },
  legalText: { flex: 1, fontSize: 12.5, color: "#063009" },
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
