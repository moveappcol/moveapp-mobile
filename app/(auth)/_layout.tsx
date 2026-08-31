import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#063009",
        headerBackTitle: "Atrás",
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: "Iniciar sesión" }} />
      <Stack.Screen name="sign-up" options={{ title: "Crear cuenta" }} />
    </Stack>
  );
}
