import { useAuth } from "@clerk/expo";
import { Link, Stack, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiFetch } from "@/lib/api";
import { BackButton } from "@/components/BackButton";

type CanjearResult = { ok: true; credits: number } | { ok: false; error: string };

/** Canjea un código de regalo a la cuenta logueada — equivalente móvil de
 * /canjear en la web, pero sin el campo de correo libre (ver nota en
 * /api/mobile/regalar/canjear). */
export default function CanjearScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [codigo, setCodigo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  async function handleSubmit() {
    if (!codigo.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const result = await apiFetch<CanjearResult>("/regalar/canjear", token, {
        method: "POST",
        body: { codigo: codigo.trim() },
      });
      if (result.ok) {
        setCredits(result.credits);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos canjear el código.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Canjear un regalo", headerLeft: () => <BackButton /> }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.emoji}>🎁</Text>
        <Text style={styles.title}>Canjear un regalo</Text>
        <Text style={styles.subtitle}>
          Escribe el código que te regalaron — los créditos quedan en tu cuenta.
        </Text>

        {!isLoaded ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : !isSignedIn ? (
          <View style={styles.guestBox}>
            <Text style={styles.subtitle}>Inicia sesión para canjear un código.</Text>
            <Link href="/sign-in" asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              </Pressable>
            </Link>
          </View>
        ) : credits !== null ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ¡Regalo activado! 🎉 Te agregamos {credits} créditos a tu cuenta.
            </Text>
            <Pressable style={styles.button} onPress={() => router.replace("/(tabs)/perfil")}>
              <Text style={styles.buttonText}>Ver mi perfil</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Código del regalo</Text>
            <TextInput
              style={styles.input}
              placeholder="XXXX-XXXX"
              placeholderTextColor="#06300966"
              autoCapitalize="characters"
              value={codigo}
              onChangeText={setCodigo}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              disabled={submitting || !codigo.trim()}
              onPress={handleSubmit}
              style={[styles.button, (submitting || !codigo.trim()) && styles.buttonDisabled]}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Canjear</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, alignItems: "center" },
  emoji: { fontSize: 40, marginTop: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#063009", marginTop: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#06300999", marginTop: 6, textAlign: "center" },
  guestBox: { marginTop: 24, width: "100%" },
  form: { marginTop: 24, width: "100%" },
  label: { fontSize: 13, fontWeight: "600", color: "#063009" },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#063009",
    textAlign: "center",
    letterSpacing: 1,
  },
  errorText: { color: "#ff4f3f", fontSize: 13, marginTop: 12, textAlign: "center" },
  successBox: { marginTop: 24, width: "100%", alignItems: "center" },
  successText: { color: "#0a8a3f", fontSize: 15, fontWeight: "600", textAlign: "center", lineHeight: 22 },
  button: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
