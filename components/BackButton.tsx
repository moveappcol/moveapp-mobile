import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

/** El botón de "Atrás" nativo del header a veces no responde al toque en
 * pantallas cuyo título cambia después del primer render (el nombre del
 * gimnasio/plan llega async y el header se reconfigura) — el swipe-back
 * seguía funcionando porque es un gesto nativo aparte, pero el botón no.
 * Usamos un botón propio con onPress explícito, igual al de (auth), que no
 * depende de ese renderizado nativo. */
export function BackButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} hitSlop={12}>
      <Text style={{ color: "#063009", fontSize: 16 }}>‹ Atrás</Text>
    </Pressable>
  );
}
