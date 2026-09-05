import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

type MapGym = { id: string; name: string; lat: number | null; lng: number | null };

const BOGOTA_REGION = {
  latitude: 4.65,
  longitude: -74.08,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

/** Mapa con un pin por gimnasio (los que sí tienen lat/lng en Airtable) —
 * tocar un pin lleva directo al detalle. Vive en su propio componente para
 * no cargar react-native-maps en pantallas que no lo necesitan. */
export function GymsMap({ gyms }: { gyms: MapGym[] }) {
  const router = useRouter();
  const conUbicacion = gyms.filter((g) => g.lat !== null && g.lng !== null);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={BOGOTA_REGION}>
        {conUbicacion.map((gym) => (
          <Marker
            key={gym.id}
            coordinate={{ latitude: gym.lat as number, longitude: gym.lng as number }}
            title={gym.name}
            pinColor="#ff4f3f"
            onCalloutPress={() => router.push(`/gimnasios/${gym.id}`)}
          />
        ))}
      </MapView>
      {conUbicacion.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyText}>Ningún gimnasio tiene ubicación registrada todavía.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 400 },
  map: { flex: 1 },
  emptyOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "#ffffffee",
    borderRadius: 12,
    padding: 12,
  },
  emptyText: { fontSize: 12, color: "#06300999", textAlign: "center" },
});
