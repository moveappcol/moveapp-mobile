import { useAuth } from "@clerk/expo";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { apiFetch } from "@/lib/api";
import { getCached, setCached } from "@/lib/cache";

const CACHE_KEY = "reservas";

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

const RATING_WINDOW_HOURS = 24;

function ratingWindowState(item: ReservationEntry): "puede-calificar" | "ya-califico" | "no-aplica" {
  if (!item.clase?.fecha || item.estado?.startsWith("Cancelado")) return "no-aplica";
  if (item.calificacion !== null) return "ya-califico";

  const finClase = new Date(item.clase.fecha).getTime() + item.clase.duracionMinutos * 60_000;
  const now = Date.now();
  if (now < finClase || now > finClase + RATING_WINDOW_HOURS * 60 * 60 * 1000) return "no-aplica";
  return "puede-calificar";
}

function RatingForm({
  reservationId,
  onRated,
}: {
  reservationId: string;
  onRated: () => void;
}) {
  const { getToken } = useAuth();
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (calificacion < 1) {
      setError("Elige al menos 1 estrella.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const result = await apiFetch<{ ok: boolean; error?: string }>(
        `/reservas/${reservationId}/calificar`,
        token,
        { method: "POST", body: { calificacion, comentario } }
      );
      if (result.ok) {
        onRated();
      } else {
        setError(result.error ?? "No pudimos guardar tu calificación.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar tu calificación.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.ratingBox}>
      <Text style={styles.ratingLabel}>¿Cómo estuvo la clase? (opcional)</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setCalificacion(n)} hitSlop={6}>
            <Text style={[styles.star, calificacion >= n && styles.starActive]}>★</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.commentInput}
        placeholder="Cuéntanos algo más (opcional)"
        placeholderTextColor="#ffffff80"
        value={comentario}
        onChangeText={setComentario}
        multiline
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Pressable style={styles.ratingButton} onPress={submit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#063009" size="small" />
        ) : (
          <Text style={styles.ratingButtonText}>Enviar</Text>
        )}
      </Pressable>
    </View>
  );
}

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
  const cached = getCached<ReservationEntry[]>(CACHE_KEY);
  const [state, setState] = useState<ScreenState>({
    loading: !cached,
    error: null,
    reservations: cached ?? [],
  });
  const [cancelState, setCancelState] = useState<
    Record<string, { loading: boolean; error: string | null }>
  >({});

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiFetch<{ reservations: ReservationEntry[] }>("/me/reservas", token);
      setCached(CACHE_KEY, data.reservations);
      setState({ loading: false, error: null, reservations: data.reservations });
    } catch {
      setState((prev) =>
        prev.reservations.length > 0
          ? { ...prev, loading: false }
          : { loading: false, error: "No pudimos cargar tus reservas.", reservations: [] }
      );
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
        const rating = ratingWindowState(item);
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.clase?.name ?? "Clase"} — {item.gym?.name ?? "Gimnasio"}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.fecha ? new Date(item.fecha).toLocaleString("es-CO") : "Sin fecha"}
            </Text>
            <Text style={styles.cardStatus}>{item.estado ?? "Reservado"}</Text>
            {rating === "ya-califico" && (
              <Text style={styles.cardSubtitle}>
                {"★".repeat(item.calificacion ?? 0)}
                {"☆".repeat(5 - (item.calificacion ?? 0))}
                {item.comentario ? ` — "${item.comentario}"` : ""}
              </Text>
            )}
            {rating === "puede-calificar" && (
              <RatingForm reservationId={item.id} onRated={load} />
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
  ratingBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: "#ffffff22",
    paddingTop: 14,
  },
  ratingLabel: { fontSize: 12, fontWeight: "700", color: "#fff" },
  starsRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  star: { fontSize: 26, color: "#ffffff40" },
  starActive: { color: "#d4ff3f" },
  commentInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ffffff33",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#fff",
    minHeight: 40,
  },
  ratingButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#d4ff3f",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  ratingButtonText: { color: "#063009", fontSize: 13, fontWeight: "700" },
});
