import { Stack } from "expo-router";
import { BackButton } from "@/components/BackButton";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#063009",
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: "Iniciar sesión" }} />
      <Stack.Screen name="sign-up" options={{ title: "Crear cuenta" }} />
    </Stack>
  );
}
