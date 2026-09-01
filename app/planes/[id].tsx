import { useAuth } from "@clerk/expo";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
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
import { CREDIT_PLANS, formatCOP } from "@/lib/credits-pricing";
import { tokenizeCard } from "@/lib/wompi";

type Config = { wompiPublicKey: string; permalinkAcceptance: string; permalinkPersonalAuth: string };
type SubscribeResult = { ok: true; credits: number } | { ok: false; error: string; pending?: boolean };

export default function PlanCheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const plan = CREDIT_PLANS.find((p) => p.id === id);

  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const [number, setNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<Config>("/config")
      .then(setConfig)
      .catch(() => setConfigError("No pudimos conectar con la pasarela de pagos."));
  }, []);

  useEffect(() => {
    if (success !== null || pending) {
      const timeout = setTimeout(() => router.replace("/perfil"), 1800);
      return () => clearTimeout(timeout);
    }
  }, [success, pending, router]);

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Plan desconocido.</Text>
      </View>
    );
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
      const result = await apiFetch<SubscribeResult>("/suscripcion/comprar", token, {
        method: "POST",
        body: { planId: plan!.id, cardToken },
      });

      if (result.ok) {
        setSuccess(result.credits);
      } else if (result.pending) {
        setPending(true);
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
      <Stack.Screen options={{ headerShown: true, title: plan.name, headerBackTitle: "Atrás" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{plan.name}</Text>
        <Text style={styles.subtitle}>{plan.label}</Text>
        <Text style={styles.price}>{formatCOP(plan.price)}/mes</Text>

        {!isLoaded ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : !isSignedIn ? (
          <View style={styles.guestBox}>
            <Text style={styles.subtitle}>Inicia sesión para suscribirte a este plan.</Text>
            <Link href="/sign-in" asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              </Pressable>
            </Link>
          </View>
        ) : success !== null ? (
          <Text style={styles.successText}>
            ¡Listo! Tu suscripción a {plan.name} quedó activa y ya tienes {success} créditos
            disponibles.
          </Text>
        ) : pending ? (
          <Text style={styles.successText}>
            Tu pago está siendo procesado. Te avisaremos apenas se confirme — revisa tu perfil en
            unos minutos.
          </Text>
        ) : (
          <View style={styles.form}>
            {configError && <Text style={styles.errorText}>{configError}</Text>}

            <Text style={styles.label}>Número de tarjeta</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="4242 4242 4242 4242"
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

            <Text style={styles.disclaimer}>
              Puedes cancelar tus clases hasta 24h antes sin costo. Para promover la diversidad de
              la red, puedes acceder a cada gimnasio un máximo de 3 veces al mes.
            </Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              disabled={submitting || !config}
              onPress={handleSubmit}
              style={[styles.button, (submitting || !config) && styles.buttonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Suscribirme — {formatCOP(plan.price)}</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#063009" },
  subtitle: { fontSize: 14, color: "#06300999", marginTop: 4 },
  price: { fontSize: 20, fontWeight: "800", color: "#ff4f3f", marginTop: 8 },
  guestBox: { marginTop: 24 },
  form: { marginTop: 24, gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#063009", marginTop: 12 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#063009",
  },
  row: { flexDirection: "row", gap: 10 },
  rowItem: { flex: 1 },
  acceptRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 20 },
  acceptText: { flex: 1, fontSize: 12, color: "#06300999", lineHeight: 18 },
  linkText: { color: "#ff4f3f" },
  disclaimer: { fontSize: 11.5, color: "#06300977", marginTop: 16, lineHeight: 17 },
  errorText: { color: "#ff4f3f", fontSize: 13, marginTop: 12 },
  successText: { color: "#0a8a3f", fontSize: 15, fontWeight: "600", marginTop: 24, lineHeight: 22 },
  button: {
    marginTop: 20,
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
