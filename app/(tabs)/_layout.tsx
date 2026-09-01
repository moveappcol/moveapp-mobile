import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTintColor: "#063009",
        tabBarActiveTintColor: "#ff4f3f",
        tabBarInactiveTintColor: "#063009",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Gimnasios" }} />
      <Tabs.Screen name="planes" options={{ title: "Planes" }} />
      <Tabs.Screen name="nosotros" options={{ title: "Nosotros" }} />
      <Tabs.Screen name="reservas" options={{ title: "Mis Reservas" }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
