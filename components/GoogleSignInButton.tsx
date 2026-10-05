import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";

// Debe llamarse una sola vez, a nivel de módulo — cierra la pestaña del
// navegador y le devuelve el control a la app en cuanto Google redirige de
// vuelta al esquema uniqueapp://sso-callback (si no se llama, la pestaña de
// auth se queda abierta después de autenticar).
WebBrowser.maybeCompleteAuthSession();

/** En Android/iOS, "precalentar" el navegador in-app antes de abrirlo hace
 * que la pantalla de Google aparezca más rápido — sin esto el primer toque
 * se siente más lento de lo normal. */
export function useWarmUpBrowser() {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export function GoogleSignInButton({
  onPress,
  loading,
}: {
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Pressable style={styles.button} onPress={onPress} disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#063009" />
      ) : (
        <Text style={styles.buttonText}>Continuar con Google</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#063009", fontSize: 15, fontWeight: "700" },
});
