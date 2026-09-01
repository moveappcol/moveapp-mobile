import { useAuth } from "@clerk/expo";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";

type Clase = { id: string; name: string; fecha: string | null; duracionMinutos: number };
type Gym = { id: string; name: string };
type ReservationEntry = {
  id: string;
  fecha: string | null;
  estado: string | null;
  calificacion: number | null;
  comentario: string | null;
  clase: Clase | null;
  gym: Gym | null;
};

type ScreenState = { loading: boolean; error: string | null; reservations: ReservationEntry[] };

function GuestPrompt() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Mis reservas</Text>
      <Text style={styles.guestText}>
        Inicia sesión para ver las clases que reservaste.
      </Text>
      <Link href="/sign-in" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function ReservationsList() {
  const { getToken } = useAuth();
  const [state, setState] = useState<ScreenState>({ loading: true, error: null, reservations: [] });
  const [cancelState, setCancelState] = useState<
    Record<string, { loading: boolean; error: string | null }>
  >({});

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiFetch<{ reservations: ReservationEntry[] }>("/me/reservas", token);
      setState({ loading: false, error: null, reservations: data.reservations });
    } catch {
      setState({ loading: false, error: "No pudimos cargar tus reservas.", reservations: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelar(reservationId: string) {
    setCancelState((prev) => ({ ...prev, [reservationId]: { loading: true, error: null } }));
    try {
      const token = await getToken();
      const result = await apiFetch<{ ok: boolean; error?: string }>(
        `/reservas/${reservationId}/cancelar`,
        token,
        { method: "POST" }
      );
      if (result.ok) {
        await load();
      } else {
        setCancelState((prev) => ({
          ...prev,
          [reservationId]: { loading: false, error: result.error ?? "No pudimos cancelar." },
        }));
      }
    } catch (err) {
      setCancelState((prev) => ({
        ...prev,
        [reservationId]: {
          loading: false,
          error: err instanceof Error ? err.message : "No pudimos cancelar.",
        },
      }));
    }
  }

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
        <Text style={styles.errorText}>{state.error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={state.reservations}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.guestText}>Todavía no tienes clases reservadas.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const cancel = cancelState[item.id];
        const puedeCancel = (item.estado ?? "Reservado") === "Reservado";
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.clase?.name ?? "Clase"} — {item.gym?.name ?? "Gimnasio"}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.fecha ? new Date(item.fecha).toLocaleString("es-CO") : "Sin fecha"}
            </Text>
            <Text style={styles.cardStatus}>{item.estado ?? "Reservado"}</Text>
            {item.calificacion !== null && (
              <Text style={styles.cardSubtitle}>
                {"★".repeat(item.calificacion)}
                {"☆".repeat(5 - item.calificacion)}
              </Text>
            )}
            {cancel?.error && <Text style={styles.errorText}>{cancel.error}</Text>}
            {puedeCancel && (
              <Pressable
                disabled={cancel?.loading}
                onPress={() => cancelar(item.id)}
                style={styles.cancelButton}
              >
                {cancel?.loading ? (
                  <ActivityIndicator color="#ff4f3f" size="small" />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
                )}
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}

export default function ReservasScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return isSignedIn ? <ReservationsList /> : <GuestPrompt />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "800", color: "#063009", marginBottom: 12 },
  guestText: { fontSize: 15, color: "#06300999", textAlign: "center", lineHeight: 22 },
  errorText: { color: "#ff4f3f", fontSize: 15, textAlign: "center" },
  button: {
    marginTop: 20,
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#063009",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  cardSubtitle: { fontSize: 13, color: "#ffffffb3", marginTop: 4 },
  cardStatus: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9be36b",
    textTransform: "uppercase",
    marginTop: 6,
  },
  cancelButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: { color: "#ff4f3f", fontSize: 13, fontWeight: "700" },
});
