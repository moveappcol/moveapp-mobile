import { useSignIn } from "@clerk/expo/legacy";
import { useSSO } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { GoogleSignInButton, useWarmUpBrowser } from "@/components/GoogleSignInButton";

type Mode = "sign-in" | "request-reset" | "reset-code";

function errorMessage(err: unknown, fallback: string) {
  return (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ?? fallback;
}

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  useWarmUpBrowser();

  const [mode, setMode] = useState<Mode>("sign-in");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onGoogleSignIn = useCallback(async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive: setActiveSSO } = await startSSOFlow({
        strategy: "oauth_google",
      });
      if (createdSessionId && setActiveSSO) {
        await setActiveSSO({ session: createdSessionId });
        router.replace("/");
      }
      // Si no hay createdSessionId (ej. la persona canceló el flujo en el
      // navegador), simplemente no pasa nada — no es un error que mostrar.
    } catch (err) {
      setError(errorMessage(err, "No pudimos iniciar sesión con Google."));
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow, router]);

  async function onSubmit() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);

    try {
      const result = await signIn.create({ identifier: email.trim(), password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        setError("No pudimos completar el inicio de sesión. Intenta de nuevo.");
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Correo o contraseña incorrectos."));
    } finally {
      setLoading(false);
    }
  }

  async function onRequestReset() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);

    try {
      await signIn.create({ identifier: email.trim(), strategy: "reset_password_email_code" });
      setInfo(`Te mandamos un código a ${email.trim()}`);
      setMode("reset-code");
    } catch (err) {
      setError(errorMessage(err, "No pudimos enviar el código. Revisa tu correo."));
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);

    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
      });

      if (attempt.status === "needs_new_password") {
        const result = await signIn.resetPassword({ password: newPassword });
        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          router.replace("/");
          return;
        }
      }

      setError("Código incorrecto o incompleto.");
    } catch (err) {
      setError(errorMessage(err, "Código incorrecto o incompleto."));
    } finally {
      setLoading(false);
    }
  }

  function backToSignIn() {
    setMode("sign-in");
    setError(null);
    setInfo(null);
    setCode("");
    setNewPassword("");
  }

  if (mode === "request-reset") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>Te mandamos un código a tu correo para restablecerla.</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor="#06300966"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={onRequestReset} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enviar código</Text>
          )}
        </Pressable>

        <Text style={styles.link} onPress={backToSignIn}>
          Volver a iniciar sesión
        </Text>
      </KeyboardAvoidingView>
    );
  }

  if (mode === "reset-code") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>Revisa tu correo</Text>
        {info && <Text style={styles.subtitle}>{info}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Código de verificación"
          placeholderTextColor="#06300966"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
        <TextInput
          style={styles.input}
          placeholder="Nueva contraseña"
          placeholderTextColor="#06300966"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={newPassword}
          onChangeText={setNewPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={onResetPassword} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Restablecer contraseña</Text>
          )}
        </Pressable>

        <Text style={styles.link} onPress={backToSignIn}>
          Volver a iniciar sesión
        </Text>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>UNIQUE</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        placeholderTextColor="#06300966"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="username"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#06300966"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        )}
      </Pressable>

      <GoogleSignInButton onPress={onGoogleSignIn} loading={googleLoading} />

      <Text
        style={styles.link}
        onPress={() => {
          setError(null);
          setMode("request-reset");
        }}
      >
        ¿Olvidaste tu contraseña?
      </Text>

      <Link href="/sign-up" style={styles.link}>
        ¿No tienes cuenta? Crea una
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
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: "#06300999",
    textAlign: "center",
    marginBottom: 24,
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
