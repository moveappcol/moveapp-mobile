import { useAuth } from "@clerk/expo";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import {
  CREDIT_PLANS,
  CIUDAD_REGALO_FISICO,
  MESES_REGALO,
  PRECIO_ENVIO_REGALO_FISICO,
  esNavidad,
  formatCOP,
} from "@/lib/credits-pricing";
import { tokenizeCard } from "@/lib/wompi";

type Config = { wompiPublicKey: string; permalinkAcceptance: string; permalinkPersonalAuth: string };
type GiftChargeResult =
  | { ok: true; codigo: string | null }
  | { ok: false; error: string; pending?: boolean };

function fechaLarga(d: Date): string {
  return d.toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "long", year: "numeric" });
}

/** Mismo cálculo que FechaLimite en el servidor (regalos.ts): 6 meses
 * desde el día de la compra. */
function seisMesesDespues(d: Date): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + 6);
  return r;
}

export default function RegalarCheckoutScreen() {
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

  const [meses, setMeses] = useState<number>(1);
  const [fisica, setFisica] = useState(false);
  const [para, setPara] = useState("");
  const [deParte, setDeParte] = useState("");
  const [direccion, setDireccion] = useState("");
  const [celular, setCelular] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Config>("/config")
      .then(setConfig)
      .catch(() => setConfigError("No pudimos conectar con la pasarela de pagos."));
  }, []);

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Plan desconocido.</Text>
      </View>
    );
  }

  const total = plan ? plan.price * meses + (fisica ? PRECIO_ENVIO_REGALO_FISICO : 0) : 0;

  async function handleSubmit() {
    setError(null);
    if (!para.trim() || !deParte.trim()) {
      setError("Escribe para quién es y de parte de quién.");
      return;
    }
    if (fisica && (!direccion.trim() || !celular.trim())) {
      setError("Escribe la dirección y el celular para la entrega.");
      return;
    }
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
      const result = await apiFetch<GiftChargeResult>("/regalar/comprar", token, {
        method: "POST",
        body: {
          planId: plan!.id,
          cardToken,
          meses,
          fisica,
          para,
          deParte,
          envio: fisica ? { ciudad: CIUDAD_REGALO_FISICO, direccion, celular } : null,
        },
      });

      if (result.ok) {
        setCodigo(result.codigo);
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

  async function compartirCodigo() {
    if (!codigo) return;
    try {
      await Share.share({
        message: `Te regalé ${meses === 1 ? "1 mes" : `${meses} meses`} de UNIQUE (plan ${plan!.name}) 🎁\n\nCódigo: ${codigo}\n\nActívalo en la app, en "Canjear un regalo", o entra a uniqueappcol.com/canjear`,
      });
    } catch {
      // si falla el share nativo no pasa nada, el código ya se ve en pantalla
    }
  }

  if (codigo !== null) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "¡Listo!", headerLeft: () => <BackButton /> }} />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.voucherEmoji}>🎁</Text>
          <Text style={styles.title}>Tu regalo está listo</Text>
          <Text style={styles.subtitle}>
            Comparte este código con quien se lo vas a regalar — lo puede activar desde la app o
            desde la web.
          </Text>

          <View style={styles.voucherBox}>
            <Text style={styles.voucherLabel}>
              {plan.name} · {meses === 1 ? "1 mes" : `${meses} meses`}
            </Text>
            <Text style={styles.voucherCode}>{codigo}</Text>
            <Text style={styles.voucherNote}>
              Comprado el {fechaLarga(new Date())}
              {"\n"}Válido hasta el {fechaLarga(seisMesesDespues(new Date()))} (6 meses desde la compra)
            </Text>
          </View>

          <Pressable style={styles.button} onPress={compartirCodigo}>
            <Text style={styles.buttonText}>Compartir código</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonOutline]} onPress={() => router.replace("/(tabs)/planes")}>
            <Text style={styles.buttonOutlineText}>Listo</Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            También te mandamos este código por correo, junto con el link para activarlo.
          </Text>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Regalar", headerLeft: () => <BackButton /> }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>{esNavidad() ? "🎄 Regalos de Navidad" : "Tarjeta de regalo"}</Text>
        <Text style={styles.title}>{plan.name}</Text>
        <Text style={styles.subtitle}>{plan.label} al mes</Text>

        <Text style={styles.label}>¿Cuántos meses?</Text>
        <View style={styles.row}>
          {MESES_REGALO.map((m) => (
            <Pressable key={m} onPress={() => setMeses(m)} style={[styles.opcion, styles.rowItem, meses === m && styles.opcionActiva]}>
              <Text style={styles.opcionTitulo}>{m === 1 ? "1 mes" : `${m} meses`}</Text>
              <Text style={styles.opcionDetalle}>{formatCOP(plan.price * m)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>¿Cómo la quieres?</Text>
        <View style={styles.row}>
          <Pressable onPress={() => setFisica(false)} style={[styles.opcion, styles.rowItem, !fisica && styles.opcionActiva]}>
            <Text style={styles.opcionTitulo}>💌 Virtual</Text>
            <Text style={styles.opcionDetalle}>Te llega al correo. Sin costo extra.</Text>
          </Pressable>
          <Pressable onPress={() => setFisica(true)} style={[styles.opcion, styles.rowItem, fisica && styles.opcionActiva]}>
            <Text style={styles.opcionTitulo}>🎁 Física</Text>
            <Text style={styles.opcionDetalle}>
              +{formatCOP(PRECIO_ENVIO_REGALO_FISICO)} de envío, solo en {CIUDAD_REGALO_FISICO}.
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Para</Text>
        <TextInput style={styles.input} placeholder="¿Para quién es?" placeholderTextColor="#06300966" value={para} onChangeText={setPara} />
        <Text style={styles.label}>De parte de</Text>
        <TextInput style={styles.input} placeholder="¿De parte de quién?" placeholderTextColor="#06300966" value={deParte} onChangeText={setDeParte} />

        {fisica && (
          <>
            <Text style={styles.label}>Ciudad</Text>
            <View style={[styles.input, { opacity: 0.7 }]}>
              <Text style={{ fontSize: 15, color: "#063009" }}>{CIUDAD_REGALO_FISICO} (por ahora solo entregamos aquí)</Text>
            </View>
            <Text style={styles.label}>Dirección de entrega</Text>
            <TextInput style={styles.input} placeholder="Calle, número, apto, barrio" placeholderTextColor="#06300966" value={direccion} onChangeText={setDireccion} />
            <Text style={styles.label}>Celular para coordinar la entrega</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" placeholder="300 123 4567" placeholderTextColor="#06300966" value={celular} onChangeText={setCelular} />
          </>
        )}

        <Text style={styles.price}>Total: {formatCOP(total)}</Text>
        <Text style={styles.validez}>⏳ El regalo es válido por 6 meses desde el día de la compra.</Text>

        {!isLoaded ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : !isSignedIn ? (
          <View style={styles.guestBox}>
            <Text style={styles.subtitle}>Inicia sesión para regalar este plan.</Text>
            <Link href="/sign-in" asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              </Pressable>
            </Link>
          </View>
        ) : pending ? (
          <Text style={styles.successText}>
            Tu pago está siendo procesado. Te avisaremos por correo apenas se confirme, con el
            código del regalo.
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
              El plan queda a nombre de quien active el código — no se activa en tu cuenta. El
              regalo es válido por 6 meses desde el día de la compra.
              {meses > 1 ? ` Quien lo active recibe ${plan.credits} créditos cada mes, durante ${meses} meses.` : ""}
              {fisica ? " Te escribiremos al correo para coordinar la entrega de la tarjeta." : ""}
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
                <Text style={styles.buttonText}>Pagar — {formatCOP(total)}</Text>
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
  container: { padding: 16, paddingBottom: 40 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#ff4f3f",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#063009", marginTop: 4 },
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
  buttonOutline: { marginTop: 10, backgroundColor: "transparent", borderWidth: 1, borderColor: "#06300933" },
  buttonOutlineText: { color: "#063009", fontSize: 15, fontWeight: "700" },
  validez: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ff4f3f4d",
    backgroundColor: "#ff4f3f0d",
    fontSize: 13,
    fontWeight: "700",
    color: "#063009",
    textAlign: "center",
    overflow: "hidden",
  },
  opcion: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 14,
    padding: 12,
  },
  opcionActiva: { borderColor: "#ff4f3f", backgroundColor: "#ff4f3f0d" },
  opcionTitulo: { fontSize: 15, fontWeight: "800", color: "#063009" },
  opcionDetalle: { fontSize: 11.5, color: "#06300999", marginTop: 2 },
  voucherEmoji: { fontSize: 40, textAlign: "center", marginTop: 12 },
  voucherBox: {
    marginTop: 24,
    backgroundColor: "#063009",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  voucherLabel: { color: "#ffffffcc", fontSize: 13, fontWeight: "700" },
  voucherCode: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 10,
  },
  voucherNote: { color: "#ffffffcc", fontSize: 12.5, marginTop: 10, textAlign: "center", lineHeight: 18 },
});
