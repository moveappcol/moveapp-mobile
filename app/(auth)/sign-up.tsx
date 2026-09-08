import { useSignUp } from "@clerk/expo/legacy";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function errorMessage(err: unknown, fallback: string) {
    return (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ?? fallback;
  }

  /** Sin verificación por código: la cuenta se crea y se activa de una vez,
   * para que sea rápido crear cuenta. Depende de que "Verify at sign-up"
   * esté apagado en el dashboard de Clerk — si sigue prendido, Clerk
   * devuelve status "missing_requirements" y mostramos el error genérico. */
  async function onSubmit() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);

    try {
      const result = await signUp.create({ emailAddress: email.trim(), password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/completar-perfil");
      } else {
        setError("No pudimos completar el registro. Intenta de nuevo.");
      }
    } catch (err) {
      setError(errorMessage(err, "No pudimos crear tu cuenta. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={[styles.title, { marginBottom: 32 }]}>UNIQUE</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Crear cuenta</Text>
        )}
      </Pressable>

      <Link href="/sign-in" style={styles.link}>
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#063009",
    textAlign: "center",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 16,
    color: "#06300999",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#063009",
    marginBottom: 12,
  },
  error: {
    color: "#ff4f3f",
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    color: "#063009",
    fontSize: 14,
  },
});
