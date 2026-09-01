import { useAuth } from "@clerk/expo";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { apiFetch } from "@/lib/api";

type Gym = {
  id: string;
  name: string;
  activities: string[];
  city: string;
  address: string;
  photoDetailUrls: string[];
  genero: "todos" | "solo_mujeres" | "solo_hombres";
  description: string | null;
  puntualidad: string | null;
  politicaCancelacion: string | null;
  ropaCalzado: string | null;
  materiales: string | null;
  servicios: string[];
  politicaMenores: string | null;
  nivelRecomendado: string | null;
  recomendaciones: string | null;
};

function InfoAccordion({ title, text }: { title: string; text: string | null }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <View style={styles.accordionItem}>
      <Pressable style={styles.accordionHeader} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Text style={styles.accordionIcon}>{open ? "×" : "+"}</Text>
      </Pressable>
      {open && <Text style={styles.accordionText}>{text}</Text>}
    </View>
  );
}

function ServiciosAccordion({ servicios }: { servicios: string[] }) {
  const [open, setOpen] = useState(false);
  if (servicios.length === 0) return null;
  return (
    <View style={styles.accordionItem}>
      <Pressable style={styles.accordionHeader} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.accordionTitle}>Servicios y amenidades</Text>
        <Text style={styles.accordionIcon}>{open ? "×" : "+"}</Text>
      </Pressable>
      {open && (
        <View style={styles.servicioChips}>
          {servicios.map((servicio) => (
            <View key={servicio} style={styles.servicioChip}>
              <Text style={styles.servicioChipText}>{servicio}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type Clase = {
  id: string;
  name: string;
  credits: number;
  cuposTotales: number;
  cuposDisponibles: number;
  fecha: string | null;
  duracionMinutos: number;
};

type GymDetailResponse = { gym: Gym; classes: Clase[] };

type ScreenState = { loading: boolean; error: string | null; data: GymDetailResponse | null };

type BookState = Record<string, { loading: boolean; error: string | null; ok: boolean }>;

export default function GymDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [state, setState] = useState<ScreenState>({ loading: true, error: null, data: null });
  const [bookState, setBookState] = useState<BookState>({});

  const load = useCallback(() => {
    setState({ loading: true, error: null, data: null });
    apiFetch<GymDetailResponse>(`/gimnasios/${id}`)
      .then((data) => setState({ loading: false, error: null, data }))
      .catch(() =>
        setState({ loading: false, error: "No pudimos cargar este gimnasio.", data: null })
      );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function reservar(claseId: string) {
    setBookState((prev) => ({ ...prev, [claseId]: { loading: true, error: null, ok: false } }));
    try {
      const token = await getToken();
      const result = await apiFetch<{ ok: boolean; error?: string }>(
        `/gimnasios/${id}/reservar`,
        token,
        { method: "POST", body: { claseId } }
      );
      if (result.ok) {
        setBookState((prev) => ({ ...prev, [claseId]: { loading: false, error: null, ok: true } }));
        load();
      } else {
        setBookState((prev) => ({
          ...prev,
          [claseId]: { loading: false, error: result.error ?? "No pudimos reservar.", ok: false },
        }));
      }
    } catch (err) {
      setBookState((prev) => ({
        ...prev,
        [claseId]: {
          loading: false,
          error: err instanceof Error ? err.message : "No pudimos reservar.",
          ok: false,
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

  if (state.error || !state.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{state.error ?? "Gimnasio no encontrado."}</Text>
      </View>
    );
  }

  const { gym, classes } = state.data;
  const generoLabel =
    gym.genero === "solo_mujeres"
      ? "Gimnasio exclusivo para mujeres"
      : gym.genero === "solo_hombres"
        ? "Gimnasio exclusivo para hombres"
        : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: gym.name.trim() }} />
      <ScrollView contentContainerStyle={styles.container}>
        {gym.photoDetailUrls.length > 0 && (
          <View style={styles.photoRow}>
            {gym.photoDetailUrls.map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.photo} />
            ))}
          </View>
        )}

        {generoLabel && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{generoLabel}</Text>
          </View>
        )}

        <Text style={styles.title}>{gym.name.trim()}</Text>
        <Text style={styles.subtitle}>{gym.activities.join(", ")}</Text>
        <Text style={styles.subtitle}>{gym.address}</Text>

        <View style={styles.accordionList}>
          <InfoAccordion title="Descripción" text={gym.description} />
          <InfoAccordion title="Puntualidad" text={gym.puntualidad} />
          <InfoAccordion title="Política de cancelación" text={gym.politicaCancelacion} />
          <InfoAccordion title="Ropa / calzado" text={gym.ropaCalzado} />
          <InfoAccordion title="Materiales" text={gym.materiales} />
          <ServiciosAccordion servicios={gym.servicios} />
          <InfoAccordion title="Política para menores de edad" text={gym.politicaMenores} />
          <InfoAccordion title="Nivel recomendado" text={gym.nivelRecomendado} />
          <InfoAccordion title="Recomendaciones" text={gym.recomendaciones} />
        </View>

        <Text style={styles.sectionTitle}>Clases disponibles</Text>

        {classes.length === 0 && (
          <Text style={styles.subtitle}>Este gimnasio todavía no tiene clases programadas.</Text>
        )}

        {classes.map((clase) => {
          const book = bookState[clase.id];
          const sinCupos = clase.cuposDisponibles <= 0;
          return (
            <View key={clase.id} style={styles.card}>
              <Text style={styles.cardTitle}>{clase.name}</Text>
              <Text style={styles.cardSubtitle}>
                {clase.fecha ? new Date(clase.fecha).toLocaleString("es-CO") : "Sin fecha"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {clase.credits} créditos · {clase.cuposDisponibles}/{clase.cuposTotales} cupos
              </Text>

              {book?.error && <Text style={styles.errorText}>{book.error}</Text>}
              {book?.ok && <Text style={styles.successText}>¡Reservado!</Text>}

              {!isLoaded ? null : isSignedIn ? (
                <Pressable
                  disabled={sinCupos || book?.loading || book?.ok}
                  onPress={() => reservar(clase.id)}
                  style={[
                    styles.button,
                    (sinCupos || book?.ok) && styles.buttonDisabled,
                  ]}
                >
                  {book?.loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {book?.ok ? "Reservado" : sinCupos ? "Sin cupos" : "Reservar"}
                    </Text>
                  )}
                </Pressable>
              ) : (
                <Link href="/sign-in" asChild>
                  <Pressable style={styles.button}>
                    <Text style={styles.buttonText}>Inicia sesión para reservar</Text>
                  </Pressable>
                </Link>
              )}
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  container: { padding: 16 },
  photoRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  photo: { flex: 1, aspectRatio: 1, borderRadius: 16, backgroundColor: "#06300911" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ff4f3f1a",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  badgeText: { color: "#ff4f3f", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  title: { fontSize: 22, fontWeight: "800", color: "#063009" },
  subtitle: { fontSize: 14, color: "#06300999", marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#063009", marginTop: 24, marginBottom: 12 },
  accordionList: { marginTop: 16, gap: 8 },
  accordionItem: {
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accordionTitle: { fontSize: 14, fontWeight: "700", color: "#063009", flex: 1, marginRight: 12 },
  accordionIcon: { fontSize: 18, fontWeight: "700", color: "#ff4f3f" },
  accordionText: { fontSize: 13, lineHeight: 20, color: "#063009b3", marginTop: 10 },
  servicioChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  servicioChip: {
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  servicioChipText: { fontSize: 12, color: "#063009b3" },
  card: {
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#063009" },
  cardSubtitle: { fontSize: 13, color: "#06300999", marginTop: 4 },
  errorText: { color: "#ff4f3f", fontSize: 13, marginTop: 8 },
  successText: { color: "#0a8a3f", fontSize: 13, marginTop: 8, fontWeight: "700" },
  button: {
    marginTop: 12,
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
