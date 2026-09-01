import { Tabs } from "expo-router";
import { TabIcon } from "@/components/TabIcon";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTintColor: "#063009",
        tabBarActiveTintColor: "#ff4f3f",
        tabBarInactiveTintColor: "#06300999",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Gimnasios",
          tabBarIcon: ({ color }) => <TabIcon name="gimnasios" color={color} />,
        }}
      />
      <Tabs.Screen
        name="planes"
        options={{
          title: "Planes",
          tabBarIcon: ({ color }) => <TabIcon name="planes" color={color} />,
        }}
      />
      <Tabs.Screen
        name="nosotros"
        options={{
          title: "Nosotros",
          tabBarIcon: ({ color }) => <TabIcon name="nosotros" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: "Mis Reservas",
          tabBarIcon: ({ color }) => <TabIcon name="reservas" color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <TabIcon name="perfil" color={color} />,
        }}
      />
    </Tabs>
  );
}
