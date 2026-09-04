import { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

/** Bloque gris con un pulso suave — para pantallas de carga que muestran la
 * forma del contenido real en vez de un spinner solo, se siente más rápido
 * aunque tarde lo mismo. */
export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: "#06300914", borderRadius: 8 },
});
