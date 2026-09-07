import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

/** Vista pequeña de un solo gimnasio, con altura fija (nunca flex) — un
 * MapView con flex dentro de un padre cuya altura no queda resuelta a
 * tiempo (común en Android dentro de layouts de tabs/scroll) se renderiza
 * colapsado a un tamaño mínimo y no responde bien al gesto de pan. Con
 * altura fija esto no pasa. El botón "Ir" abre la app de Google Maps
 * (o el navegador si no está instalada) con la ruta ya armada. */
export function GymLocationCard({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  function abrirEnGoogleMaps() {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        pointerEvents="none"
      >
        <Marker coordinate={{ latitude: lat, longitude: lng }} title={name} pinColor="#ff4f3f" />
      </MapView>
      <Pressable style={styles.button} onPress={abrirEnGoogleMaps}>
        <Text style={styles.buttonText}>Ir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  map: { ...StyleSheet.absoluteFillObject },
  button: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  buttonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
