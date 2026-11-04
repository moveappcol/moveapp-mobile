import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Updates from "expo-updates";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Falta EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY en .env.local");
}

// Pantallas donde la persona está a mitad de algo (reservando, pagando,
// creando la cuenta) — si vuelve de segundo plano estando aquí, la dejamos
// donde estaba en vez de mandarla a Gimnasios.
const PROTECTED_PATH_PREFIXES = [
  "/gimnasios/",
  "/planes/",
  "/creditos/",
  "/completar-perfil",
  "/sign-in",
  "/sign-up",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function ResetToGymsOnForeground() {
  const router = useRouter();
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        if (!isProtectedPath(pathnameRef.current)) {
          router.replace("/");
        }
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}

/** Por defecto expo-updates baja la actualización en segundo plano y solo
 * la aplica en un arranque posterior — un arreglo urgente podía tardar
 * varias aperturas en llegarle a la gente. Aquí, al abrir la app y al
 * volver de segundo plano, buscamos si hay una nueva y la aplicamos de una
 * vez (salvo a mitad de una reserva o pago, para no cortarle nada). */
async function applyPendingUpdate() {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch {
    // sin red o falla de Expo: se queda con la versión que ya tiene
  }
}

function ApplyUpdatesOnOpen() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    applyPendingUpdate();
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && !isProtectedPath(pathnameRef.current)) {
        applyPendingUpdate();
      }
    });
    return () => subscription.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <ResetToGymsOnForeground />
      <ApplyUpdatesOnOpen />
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
