import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Falta EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY en .env.local");
}

function ResetToGymsOnForeground() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        router.replace("/");
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <ResetToGymsOnForeground />
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
