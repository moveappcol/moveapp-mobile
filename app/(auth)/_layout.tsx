import { Stack, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

function BackButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} hitSlop={12}>
      <Text style={{ color: "#063009", fontSize: 16 }}>‹ Atrás</Text>
    </Pressable>
  );
}

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
