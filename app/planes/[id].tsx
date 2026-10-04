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
import { BackButton } from "@/components/BackButton";
import { CREDIT_PLANS, formatCOP } from "@/lib/credits-pricing";
import { tokenizeCard } from "@/lib/wompi";

type Config = { wompiPublicKey: string; permalinkAcceptance: string; permalinkPersonalAuth: string };
type SubscribeResult = { ok: true; credits: number } | { ok: false; error: string; pending?: boolean };

type CouponPreview =
  | { ok: true; tipo: "Créditos gratis"; creditos: number }
  | { ok: true; tipo: "Descuento"; descuentoPorcentaje: number; fechaInicio?: string }
  | { ok: false; error: string };

type CouponState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "invalid"; error: string }
  | { status: "valid-descuento"; descuentoPorcentaje: number };

type ValidacionCodigoReferido = { ok: true; esInfluencer: boolean } | { ok: false; error: string };

type ReferidoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "invalid"; error: string }
  | { status: "valid"; esInfluencer: boolean };

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

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponState>({ status: "idle" });
  const [codigoReferidoInput, setCodigoReferidoInput] = useState("");
  const [referido, setReferido] = useState<ReferidoState>({ status: "idle" });

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

  async function handleValidarCupon() {
    if (!couponInput.trim()) return;
    setCoupon({ status: "loading" });
    try {
      const token = await getToken();
      const result = await apiFetch<CouponPreview>("/cupon/validar", token, {
        method: "POST",
        body: { code: couponInput.trim() },
      });
      if (!result.ok) {
        setCoupon({ status: "invalid", error: result.error });
      } else if (result.tipo === "Créditos gratis") {
        setCoupon({ status: "invalid", error: "Ese cupón no aplica a este pago." });
      } else {
        setCoupon({ status: "valid-descuento", descuentoPorcentaje: result.descuentoPorcentaje });
      }
    } catch {
      setCoupon({ status: "invalid", error: "No pudimos validar el cupón." });
    }
  }

  async function handleValidarReferido() {
    if (!codigoReferidoInput.trim()) return;
    setReferido({ status: "loading" });
    try {
      const token = await getToken();
      const result = await apiFetch<ValidacionCodigoReferido>("/codigo-referido/validar", token, {
        method: "POST",
        body: { code: codigoReferidoInput.trim() },
      });
      if (!result.ok) {
        setReferido({ status: "invalid", error: result.error });
      } else {
        setReferido({ status: "valid", esInfluencer: result.esInfluencer });
      }
    } catch {
      setReferido({ status: "invalid", error: "No pudimos validar el código." });
    }
  }

  const discountedPrice =
    coupon.status === "valid-descuento"
      ? Math.round(plan!.price * (1 - coupon.descuentoPorcentaje / 100))
      : null;

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
    // Si escribió un código pero nunca lo validó (o quedó inválido), se
    // frena acá antes de cobrar — mismo criterio que el checkout web.
    if (codigoReferidoInput.trim() && referido.status !== "valid") {
      setError("Valida el código de referido antes de pagar, o bórralo si no tienes uno.");
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
        body: {
          planId: plan!.id,
          cardToken,
          couponCode: coupon.status === "valid-descuento" ? couponInput.trim() : undefined,
          codigoReferido: referido.status === "valid" ? codigoReferidoInput.trim() : undefined,
        },
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
      <Stack.Screen options={{ headerShown: true, title: plan.name, headerLeft: () => <BackButton /> }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{plan.name}</Text>
        <Text style={styles.subtitle}>{plan.label}</Text>
        {discountedPrice !== null ? (
          <View style={styles.priceRow}>
            <Text style={styles.priceStrikethrough}>{formatCOP(plan.price)}</Text>
            <Text style={styles.price}>{formatCOP(discountedPrice)}/mes</Text>
          </View>
        ) : (
          <Text style={styles.price}>{formatCOP(plan.price)}/mes</Text>
        )}

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

            <Text style={styles.label}>¿Tienes un cupón? (opcional)</Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="Código de cupón"
                placeholderTextColor="#06300966"
                autoCapitalize="characters"
                value={couponInput}
                onChangeText={(text) => {
                  setCouponInput(text);
                  setCoupon({ status: "idle" });
                }}
              />
              <Pressable
                style={styles.codeButton}
                disabled={coupon.status === "loading" || !couponInput.trim()}
                onPress={handleValidarCupon}
              >
                <Text style={styles.codeButtonText}>
                  {coupon.status === "loading" ? "..." : "Validar"}
                </Text>
              </Pressable>
            </View>
            {coupon.status === "invalid" && <Text style={styles.errorText}>{coupon.error}</Text>}
            {coupon.status === "valid-descuento" && (
              <Text style={styles.successTextSmall}>
                Cupón aplicado — {coupon.descuentoPorcentaje}% de descuento ✓
              </Text>
            )}

            <Text style={styles.label}>¿Alguien te refirió? (opcional)</Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="Código de referido"
                placeholderTextColor="#06300966"
                autoCapitalize="characters"
                value={codigoReferidoInput}
                onChangeText={(text) => {
                  setCodigoReferidoInput(text);
                  setReferido({ status: "idle" });
                }}
              />
              <Pressable
                style={styles.codeButton}
                disabled={referido.status === "loading" || !codigoReferidoInput.trim()}
                onPress={handleValidarReferido}
              >
                <Text style={styles.codeButtonText}>
                  {referido.status === "loading" ? "..." : "Validar"}
                </Text>
              </Pressable>
            </View>
            {referido.status === "invalid" && <Text style={styles.errorText}>{referido.error}</Text>}
            {referido.status === "valid" && (
              <Text style={styles.successTextSmall}>
                {referido.esInfluencer
                  ? "Código válido — tú y quien te refirió ganan 5 créditos cada uno ✓"
                  : "Código válido ✓"}
              </Text>
            )}

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
                <Text style={styles.buttonText}>
                  Suscribirme — {formatCOP(discountedPrice ?? plan.price)}
                </Text>
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
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 8 },
  priceStrikethrough: { fontSize: 14, color: "#06300966", textDecorationLine: "line-through" },
  codeRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  codeInput: { flex: 1, marginBottom: 0 },
  codeButton: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  codeButtonText: { fontSize: 13, fontWeight: "700", color: "#063009" },
  successTextSmall: { color: "#0a8a3f", fontSize: 12.5, fontWeight: "600", marginTop: 6 },
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
