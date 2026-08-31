import { useAuth, useUser } from "@clerk/expo";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";

type CreditsResponse = { credits: number; vencimiento: string | null; perfilCompleto: boolean };
type ScreenState = { loading: boolean; error: string | null; data: CreditsResponse | null };

function GuestView() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu cuenta</Text>
      <Text style={styles.guestText}>
        Podés explorar los gimnasios sin cuenta. Para reservar clases y comprar créditos,
        necesitás iniciar sesión o crear una cuenta.
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
  const [state, setState] = useState<ScreenState>({ loading: true, error: null, data: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const token = await getToken();
      const data = await apiFetch<CreditsResponse>("/me/credits", token);
      setState({ loading: false, error: null, data });
    } catch {
      setState({ loading: false, error: "No pudimos cargar tus créditos.", data: null });
    }
  }, [getToken]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>

      {state.loading && <ActivityIndicator style={styles.loader} />}
      {state.error && <Text style={styles.error}>{state.error}</Text>}

      {state.data && (
        <View style={styles.card}>
          <Text style={styles.creditsNumber}>{state.data.credits}</Text>
          <Text style={styles.creditsLabel}>créditos disponibles</Text>
          {state.data.vencimiento && (
            <Text style={styles.expiry}>Vencen el {state.data.vencimiento}</Text>
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
    backgroundColor: "#06300908",
    paddingVertical: 32,
    alignItems: "center",
  },
  creditsNumber: { fontSize: 48, fontWeight: "800", color: "#063009" },
  creditsLabel: { fontSize: 14, color: "#06300999", marginTop: 4 },
  expiry: { fontSize: 13, color: "#06300977", marginTop: 12 },
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
