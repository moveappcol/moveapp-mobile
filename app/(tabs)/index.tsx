import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";

type Gym = {
  id: string;
  name: string;
  city: string;
  activities: string[];
};

type GymsResponse = { comingSoon: boolean; gyms: Gym[] };

type ScreenState = { loading: boolean; error: string | null; data: GymsResponse | null };

export default function GimnasiosScreen() {
  const [state, setState] = useState<ScreenState>({ loading: true, error: null, data: null });

  useEffect(() => {
    apiFetch<GymsResponse>("/gyms")
      .then((data) => setState({ loading: false, error: null, data }))
      .catch(() =>
        setState({ loading: false, error: "No pudimos cargar los gimnasios.", data: null })
      );
  }, []);

  if (state.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{state.error}</Text>
      </View>
    );
  }

  if (state.data?.comingSoon) {
    return (
      <View style={styles.center}>
        <Text style={styles.comingSoon}>Coming soon</Text>
        <Text style={styles.subtitle}>
          Estamos confirmando los primeros gimnasios afiliados. Muy pronto podrás verlos y
          reservar clases aquí.
        </Text>
      </View>
    );
  }

  const gyms = state.data?.gyms ?? [];

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={gyms}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text style={styles.subtitle}>No hay gimnasios disponibles todavía.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.name.trim()}</Text>
          <Text style={styles.cardSubtitle}>{item.activities.join(", ")}</Text>
          <Text style={styles.cardSubtitle}>{item.city}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#ff4f3f", fontSize: 15 },
  comingSoon: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ff4f3f",
    textTransform: "uppercase",
  },
  subtitle: { fontSize: 14, color: "#06300999", textAlign: "center", marginTop: 8 },
  list: { padding: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#063009" },
  cardSubtitle: { fontSize: 13, color: "#06300999", marginTop: 4 },
});
