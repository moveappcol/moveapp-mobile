import { useAuth, useUser } from "@clerk/expo";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";

type CreditsResponse = { credits: number; vencimiento: string | null; perfilCompleto: boolean };
type PlanInfo = { id: string; name?: string; label: string; price: number };
type PlanResponse =
  | { hasSubscription: false }
  | {
      hasSubscription: true;
      estado: string;
      plan: PlanInfo | null;
      proximoCobro: string | null;
      planSiguiente: PlanInfo | null;
    };
type ScreenState = {
  loading: boolean;
  error: string | null;
  credits: CreditsResponse | null;
  plan: PlanResponse | null;
};

function GuestView() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu cuenta</Text>
      <Text style={styles.guestText}>
        Puedes explorar los gimnasios sin cuenta. Para reservar clases y comprar créditos,
        necesitas iniciar sesión o crear una cuenta.
      </Text>

      <Link href="/sign-in" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </Pressable>
      </Link>

      <Link href="/sign-up" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function SignedInView() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const [state, setState] = useState<ScreenState>({
    loading: true,
    error: null,
    credits: null,
    plan: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const [credits, plan] = await Promise.all([
          apiFetch<CreditsResponse>("/me/credits", token),
          apiFetch<PlanResponse>("/me/plan", token),
        ]);
        setState({ loading: false, error: null, credits, plan });
      } catch {
        setState({
          loading: false,
          error: "No pudimos cargar tu cuenta.",
          credits: null,
          plan: null,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>

      {state.loading && <ActivityIndicator style={styles.loader} />}
      {state.error && <Text style={styles.error}>{state.error}</Text>}

      {state.credits && (
        <View style={styles.card}>
          <Text style={styles.creditsNumber}>{state.credits.credits}</Text>
          <Text style={styles.creditsLabel}>créditos disponibles</Text>
          {state.credits.vencimiento && (
            <Text style={styles.expiry}>Vencen el {state.credits.vencimiento}</Text>
          )}
        </View>
      )}

      {state.plan && (
        <View style={styles.planCard}>
          <Text style={styles.planLabel}>Mi plan</Text>
          {state.plan.hasSubscription ? (
            <>
              <Text style={styles.planName}>
                {state.plan.plan ? `${state.plan.plan.name ?? ""} — ${state.plan.plan.label}` : "—"}
              </Text>
              <Text style={styles.planMeta}>Estado: {state.plan.estado}</Text>
              {state.plan.proximoCobro && (
                <Text style={styles.planMeta}>Próximo cobro: {state.plan.proximoCobro}</Text>
              )}
              {state.plan.planSiguiente && (
                <Text style={styles.planMeta}>
                  Cambia a {state.plan.planSiguiente.name} ({state.plan.planSiguiente.label}) en la
                  próxima renovación
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.planMeta}>Todavía no tienes un plan activo.</Text>
          )}
        </View>
      )}

      <Pressable style={styles.signOutButton} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

export default function PerfilScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return isSignedIn ? <SignedInView /> : <GuestView />;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#063009",
    marginBottom: 12,
  },
  guestText: {
    fontSize: 15,
    color: "#06300999",
    lineHeight: 22,
    marginBottom: 24,
  },
  email: { fontSize: 14, color: "#06300999", textAlign: "center", marginBottom: 16 },
  loader: { marginTop: 24 },
  error: { color: "#ff4f3f", fontSize: 14, textAlign: "center", marginTop: 16 },
  card: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: "#063009",
    paddingVertical: 32,
    alignItems: "center",
  },
  creditsNumber: { fontSize: 48, fontWeight: "800", color: "#fff" },
  creditsLabel: { fontSize: 14, color: "#ffffffb3", marginTop: 4 },
  expiry: { fontSize: 13, color: "#ffffff80", marginTop: 12 },
  planCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#063009",
    padding: 20,
  },
  planLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ff4f3f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  planName: { fontSize: 17, fontWeight: "700", color: "#fff" },
  planMeta: { fontSize: 13, color: "#ffffffb3", marginTop: 4 },
  button: {
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#06300933",
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#063009", fontSize: 16, fontWeight: "700" },
  signOutButton: {
    marginTop: "auto",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ff4f3f",
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { color: "#ff4f3f", fontSize: 15, fontWeight: "700" },
});
