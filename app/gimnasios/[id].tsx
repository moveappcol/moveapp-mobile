import { useAuth } from "@clerk/expo";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "@/lib/api";
import { getCached, setCached } from "@/lib/cache";
import { BackButton } from "@/components/BackButton";
import { Skeleton } from "@/components/Skeleton";
import { useFavorites } from "@/lib/favorites";
import { GymLocationCard } from "@/components/GymLocationCard";
import { precioEfectivo, type Clase } from "@/lib/classes";
import { DAY_KEY_FORMATTER, semanaActual, formatHora } from "@/lib/dias";

const SCREEN_WIDTH = Dimensions.get("window").width;

function PhotoViewer({
  photos,
  initialIndex,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerBackdrop}>
        <Pressable style={styles.viewerClose} onPress={onClose} hitSlop={16}>
          <Text style={styles.viewerCloseText}>×</Text>
        </Pressable>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        >
          {photos.map((url) => (
            <View key={url} style={styles.viewerPage}>
              <Image source={{ uri: url }} style={styles.viewerImage} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

type Gym = {
  id: string;
  name: string;
  activities: string[];
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  photoDetailUrls: string[];
  photoDetailFullUrls: string[];
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
  bookingCutoffMinutes: number;
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

function isBookingClosed(fecha: string, cutoffMinutes: number): boolean {
  const minutesUntilClass = (new Date(fecha).getTime() - Date.now()) / (1000 * 60);
  return minutesUntilClass < cutoffMinutes;
}

type GymDetailResponse = {
  gym: Gym;
  classes: Clase[];
  reservedClaseIds?: string[];
  reservasAbiertas: boolean;
  reservasAbrenLabel: string;
};

type ScreenState = { loading: boolean; error: string | null; data: GymDetailResponse | null };

type BookState = Record<
  string,
  {
    loading: boolean;
    error: string | null;
    ok: boolean;
    code?: string;
    remainingCredits?: number;
    dismissed?: boolean;
  }
>;

type WaitlistState = Record<
  string,
  { loading: boolean; enEspera: boolean; posicion: number | null; error: string | null }
>;

export default function GymDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const semana = useMemo(() => semanaActual(), []);
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => semana[0].key);
  const cacheKey = `gimnasio:${id}`;
  const cached = getCached<GymDetailResponse>(cacheKey);
  const [state, setState] = useState<ScreenState>({
    loading: !cached,
    error: null,
    data: cached ?? null,
  });
  const [bookState, setBookState] = useState<BookState>({});
  const [waitlistState, setWaitlistState] = useState<WaitlistState>({});
  const [molestiasState, setMolestiasState] = useState<Record<string, string>>({});
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, loading: !prev.data, error: null }));
    apiFetch<GymDetailResponse>(`/gimnasios/${id}`)
      .then((data) => {
        setCached(cacheKey, data);
        setState({ loading: false, error: null, data });
        for (const url of data.gym.photoDetailUrls) Image.prefetch(url);
      })
      .catch(() =>
        setState((prev) =>
          prev.data
            ? { ...prev, loading: false }
            : { loading: false, error: "No pudimos cargar este gimnasio.", data: null }
        )
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!isSignedIn || !state.data) return;
    const reservedIds = new Set(state.data.reservedClaseIds ?? []);
    const llenas = state.data.classes.filter(
      (c) => c.cuposDisponibles <= 0 && !reservedIds.has(c.id)
    );
    for (const clase of llenas) {
      if (waitlistState[clase.id]) continue;
      (async () => {
        try {
          const token = await getToken();
          const status = await apiFetch<{ enEspera: boolean; posicion: number | null }>(
            `/gimnasios/${id}/lista-espera?claseId=${clase.id}`,
            token
          );
          setWaitlistState((prev) => ({
            ...prev,
            [clase.id]: { loading: false, error: null, ...status },
          }));
        } catch {
          // si falla la consulta simplemente no mostramos el estado — el
          // botón de "Unirme" sigue disponible igual
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, state.data]);

  async function unirseListaEspera(claseId: string) {
    setWaitlistState((prev) => ({
      ...prev,
      [claseId]: { loading: true, error: null, enEspera: false, posicion: null },
    }));
    try {
      const token = await getToken();
      const result = await apiFetch<{ ok: boolean; posicion: number; error?: string }>(
        `/gimnasios/${id}/lista-espera`,
        token,
        { method: "POST", body: { claseId } }
      );
      setWaitlistState((prev) => ({
        ...prev,
        [claseId]: { loading: false, error: null, enEspera: true, posicion: result.posicion },
      }));
    } catch (err) {
      setWaitlistState((prev) => ({
        ...prev,
        [claseId]: {
          loading: false,
          enEspera: false,
          posicion: null,
          error: err instanceof Error ? err.message : "No pudimos unirte a la lista de espera.",
        },
      }));
    }
  }

  async function salirListaEspera(claseId: string) {
    setWaitlistState((prev) => ({ ...prev, [claseId]: { ...prev[claseId], loading: true } }));
    try {
      const token = await getToken();
      await apiFetch(`/gimnasios/${id}/lista-espera?claseId=${claseId}`, token, {
        method: "DELETE",
      });
      setWaitlistState((prev) => ({
        ...prev,
        [claseId]: { loading: false, error: null, enEspera: false, posicion: null },
      }));
    } catch {
      setWaitlistState((prev) => ({ ...prev, [claseId]: { ...prev[claseId], loading: false } }));
    }
  }

  async function reservar(claseId: string) {
    setBookState((prev) => ({ ...prev, [claseId]: { loading: true, error: null, ok: false } }));
    try {
      const token = await getToken();
      const result = await apiFetch<{
        ok: boolean;
        error?: string;
        code?: string;
        remainingCredits?: number;
      }>(`/gimnasios/${id}/reservar`, token, {
        method: "POST",
        body: { claseId, molestias: molestiasState[claseId]?.trim() || undefined },
      });
      if (result.ok) {
        setBookState((prev) => ({
          ...prev,
          [claseId]: {
            loading: false,
            error: null,
            ok: true,
            remainingCredits: result.remainingCredits,
          },
        }));
        load();
      } else {
        setBookState((prev) => ({
          ...prev,
          [claseId]: {
            loading: false,
            error: result.error ?? "No pudimos reservar.",
            ok: false,
            code: result.code,
          },
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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.photoRow}>
          <Skeleton style={[styles.photoPressable, { aspectRatio: 1, borderRadius: 16 }]} />
          <Skeleton style={[styles.photoPressable, { aspectRatio: 1, borderRadius: 16 }]} />
          <Skeleton style={[styles.photoPressable, { aspectRatio: 1, borderRadius: 16 }]} />
        </View>
        <Skeleton style={{ height: 22, width: "60%", borderRadius: 6, marginTop: 12 }} />
        <Skeleton style={{ height: 14, width: "40%", borderRadius: 4, marginTop: 10 }} />
        <Skeleton style={{ height: 14, width: "55%", borderRadius: 4, marginTop: 6 }} />
        <Skeleton style={{ height: 100, width: "100%", borderRadius: 16, marginTop: 24 }} />
        <Skeleton style={{ height: 100, width: "100%", borderRadius: 16, marginTop: 12 }} />
      </ScrollView>
    );
  }

  if (state.error || !state.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{state.error ?? "Gimnasio no encontrado."}</Text>
      </View>
    );
  }

  const { gym, classes, reservedClaseIds, reservasAbiertas, reservasAbrenLabel } = state.data;
  const reservedSet = new Set(reservedClaseIds ?? []);
  const diaActivo = semana.find((d) => d.key === diaSeleccionado) ?? semana[0];
  const clasesDelDia = classes.filter(
    (c) => c.fecha && DAY_KEY_FORMATTER.format(new Date(c.fecha)) === diaActivo.key
  );
  const generoLabel =
    gym.genero === "solo_mujeres"
      ? "Gimnasio exclusivo para mujeres"
      : gym.genero === "solo_hombres"
        ? "Gimnasio exclusivo para hombres"
        : null;

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: gym.name.trim(), headerLeft: () => <BackButton /> }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {gym.photoDetailUrls.length > 0 && (
          <View style={styles.photoRow}>
            {gym.photoDetailUrls.map((url, index) => (
              <Pressable key={url} style={styles.photoPressable} onPress={() => setViewerIndex(index)}>
                <Image source={{ uri: url }} style={styles.photo} />
              </Pressable>
            ))}
          </View>
        )}

        {generoLabel && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{generoLabel}</Text>
          </View>
        )}

        <View style={styles.titleRow}>
          <Text style={[styles.title, { flex: 1 }]}>{gym.name.trim()}</Text>
          <Pressable hitSlop={10} onPress={() => toggleFavorite(gym.id)}>
            <Text style={styles.titleFavoriteIcon}>{isFavorite(gym.id) ? "♥" : "♡"}</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>{gym.activities.join(", ")}</Text>
        <Text style={styles.subtitle}>{gym.address}</Text>

        {gym.lat !== null && gym.lng !== null && (
          <View style={styles.locationCardWrap}>
            <GymLocationCard lat={gym.lat} lng={gym.lng} name={gym.name} />
          </View>
        )}

        <Text style={styles.sectionTitle}>Clases disponibles</Text>
        <Text style={styles.limiteMensual}>
          Puedes reservar en este gimnasio un máximo de 3 veces al mes.
        </Text>

        {classes.length === 0 && (
          <Text style={styles.subtitle}>Este gimnasio todavía no tiene clases programadas.</Text>
        )}

        {classes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.diaRow}
            contentContainerStyle={styles.diaRowContent}
          >
            {semana.map((dia) => (
              <Pressable
                key={dia.key}
                style={[styles.diaChip, diaSeleccionado === dia.key && styles.diaChipActive]}
                onPress={() => setDiaSeleccionado(dia.key)}
              >
                <Text
                  style={[
                    styles.diaChipLabel,
                    diaSeleccionado === dia.key && styles.diaChipLabelActive,
                  ]}
                >
                  {dia.label.slice(0, 3)}
                </Text>
                <Text
                  style={[
                    styles.diaChipFecha,
                    diaSeleccionado === dia.key && styles.diaChipFechaActive,
                  ]}
                >
                  {dia.fechaLabel}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {classes.length > 0 && (
          <View style={styles.diaHeader}>
            <Text style={styles.diaTitulo}>{diaActivo.label}</Text>
            <Text style={styles.diaFecha}>{diaActivo.fechaLabel}</Text>
          </View>
        )}

        {classes.length > 0 && clasesDelDia.length === 0 && (
          <Text style={styles.subtitle}>No hay clases programadas para este día.</Text>
        )}

        {clasesDelDia.map((clase) => {
          const book = bookState[clase.id];
          const sinCupos = clase.cuposDisponibles <= 0;
          const yaReservada = reservedSet.has(clase.id) && !book?.ok;
          return (
            <View key={clase.id} style={styles.card}>
              <Text style={styles.cardTitle}>{clase.name}</Text>
              <Text style={styles.cardSubtitle}>
                {clase.fecha ? formatHora(clase.fecha) : "Hora por confirmar"}
              </Text>
              {clase.descripcion && (
                <Text style={styles.cardDescripcion}>{clase.descripcion}</Text>
              )}
              <Text style={styles.cardSubtitle}>
                {precioEfectivo(clase) < clase.credits && (
                  <Text style={styles.creditsStrikethrough}>{clase.credits} </Text>
                )}
                {precioEfectivo(clase)} créditos
              </Text>
              {clase.cuposDisponibles > 0 && clase.cuposDisponibles <= 2 && (
                <Text style={styles.cuposAviso}>
                  {clase.cuposDisponibles === 1
                    ? "Último cupo disponible"
                    : "Últimos 2 cupos disponibles"}
                </Text>
              )}

              {book?.error && <Text style={styles.errorText}>{book.error}</Text>}
              {book?.code === "perfil_incompleto" && (
                <Pressable
                  style={[styles.button, styles.buttonOutline]}
                  onPress={() => router.push("/completar-perfil")}
                >
                  <Text style={styles.buttonOutlineText}>Completar perfil</Text>
                </Pressable>
              )}
              {book?.ok && !book?.dismissed && (
                <Modal transparent animationType="fade" visible>
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                      <View style={styles.confirmCheck}>
                        <Text style={styles.confirmCheckIcon}>✓</Text>
                      </View>
                      <Text style={styles.modalTitle}>Reserva confirmada</Text>
                      <Text style={styles.modalSubtitle}>
                        Créditos restantes: {book.remainingCredits ?? 0}.
                      </Text>
                      <Pressable
                        style={styles.modalButton}
                        onPress={() =>
                          setBookState((prev) => ({
                            ...prev,
                            [clase.id]: { ...prev[clase.id], dismissed: true },
                          }))
                        }
                      >
                        <Text style={styles.modalButtonText}>Listo</Text>
                      </Pressable>
                    </View>
                  </View>
                </Modal>
              )}
              {book?.ok && book?.dismissed && (
                <Text style={styles.successText}>Ya reservaste esta clase.</Text>
              )}

              {yaReservada ? (
                <Text style={styles.successText}>Ya reservaste esta clase.</Text>
              ) : !reservasAbiertas ? (
                <Text style={styles.mutedText}>
                  Todavía estamos cargando los cupos — las reservas abren el {reservasAbrenLabel}.
                </Text>
              ) : !clase.fecha ? (
                <Text style={styles.mutedText}>Todavía no tiene fecha confirmada.</Text>
              ) : !sinCupos && isBookingClosed(clase.fecha, gym.bookingCutoffMinutes) ? (
                <Text style={styles.mutedText}>Las reservas para esta clase ya cerraron.</Text>
              ) : !isLoaded ? null : !isSignedIn ? (
                <Link href="/sign-in" asChild>
                  <Pressable style={styles.button}>
                    <Text style={styles.buttonText}>Inicia sesión para reservar</Text>
                  </Pressable>
                </Link>
              ) : sinCupos ? (
                (() => {
                  const waitlist = waitlistState[clase.id];
                  if (waitlist?.error) {
                    return <Text style={styles.errorText}>{waitlist.error}</Text>;
                  }
                  if (waitlist?.enEspera) {
                    return (
                      <View>
                        <Text style={styles.waitlistText}>
                          Estás en la lista de espera
                          {waitlist.posicion ? ` (posición ${waitlist.posicion})` : ""} — te
                          avisamos si se libera un cupo.
                        </Text>
                        <Pressable
                          style={[styles.button, styles.buttonOutline]}
                          disabled={waitlist.loading}
                          onPress={() => salirListaEspera(clase.id)}
                        >
                          {waitlist.loading ? (
                            <ActivityIndicator color="#ff4f3f" />
                          ) : (
                            <Text style={styles.buttonOutlineText}>Salir de la lista</Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  }
                  return (
                    <Pressable
                      style={styles.button}
                      disabled={waitlist?.loading}
                      onPress={() => unirseListaEspera(clase.id)}
                    >
                      {waitlist?.loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Unirme a la lista de espera</Text>
                      )}
                    </Pressable>
                  );
                })()
              ) : (
                <>
                  <Text style={styles.molestiasLabel}>
                    ¿Algún dolor o molestia que quieras que el gimnasio tenga en cuenta? (opcional)
                  </Text>
                  <TextInput
                    style={styles.molestiasInput}
                    placeholder="Ej: dolor de rodilla, embarazo, lesión reciente…"
                    placeholderTextColor="#06300966"
                    multiline
                    maxLength={300}
                    value={molestiasState[clase.id] ?? ""}
                    onChangeText={(text) =>
                      setMolestiasState((prev) => ({ ...prev, [clase.id]: text }))
                    }
                  />
                  <Pressable
                    disabled={book?.loading || book?.ok}
                    onPress={() => reservar(clase.id)}
                    style={[styles.button, book?.ok && styles.buttonDisabled]}
                  >
                    {book?.loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>{book?.ok ? "Reservado" : "Reservar"}</Text>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          );
        })}

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
      </ScrollView>

      {viewerIndex !== null && (
        <PhotoViewer
          photos={gym.photoDetailFullUrls}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  container: { padding: 16 },
  photoRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  viewerBackdrop: { flex: 1, backgroundColor: "#000000ee", justifyContent: "center" },
  viewerClose: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff22",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCloseText: { color: "#fff", fontSize: 22, lineHeight: 24 },
  viewerPage: { width: SCREEN_WIDTH, alignItems: "center", justifyContent: "center" },
  viewerImage: { width: SCREEN_WIDTH, height: "100%" },
  photoPressable: { flex: 1 },
  photo: { width: "100%", aspectRatio: 1, borderRadius: 16, backgroundColor: "#06300911" },
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleFavoriteIcon: { fontSize: 24, color: "#ff4f3f" },
  subtitle: { fontSize: 14, color: "#06300999", marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#063009", marginTop: 24, marginBottom: 12 },
  limiteMensual: { fontSize: 11, color: "#06300980", marginTop: -8, marginBottom: 12 },
  diaRow: { marginBottom: 16 },
  diaRowContent: { flexDirection: "row", gap: 8 },
  diaChip: {
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#06300908",
  },
  diaChipActive: { backgroundColor: "#063009" },
  diaChipLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#06300999",
  },
  diaChipLabelActive: { color: "#fff" },
  diaChipFecha: { fontSize: 10, color: "#06300977", marginTop: 2 },
  diaChipFechaActive: { color: "#ffffffcc" },
  diaGrupo: { marginBottom: 20 },
  diaHeader: { flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 10 },
  diaTitulo: { fontSize: 16, fontWeight: "800", color: "#063009" },
  diaFecha: { fontSize: 13, color: "#06300980" },
  locationCardWrap: { marginTop: 12 },
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
  cardDescripcion: { fontSize: 13, color: "#063009b3", marginTop: 4 },
  creditsStrikethrough: { textDecorationLine: "line-through", color: "#06300966" },
  cuposAviso: {
    fontSize: 12,
    fontWeight: "800",
    color: "#dc2626",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 4,
  },
  molestiasLabel: { fontSize: 12, color: "#06300999", marginTop: 10 },
  molestiasInput: {
    marginTop: 6,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#063009",
    textAlignVertical: "top",
  },
  errorText: { color: "#ff4f3f", fontSize: 13, marginTop: 8 },
  mutedText: { color: "#06300980", fontSize: 13, marginTop: 8 },
  successText: { color: "#0a8a3f", fontSize: 13, marginTop: 8, fontWeight: "700" },
  confirmCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#063009",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCheckIcon: { color: "#fff", fontSize: 20, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(6,48,9,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    backgroundColor: "#fff",
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  modalTitle: { marginTop: 14, fontSize: 18, fontWeight: "800", color: "#063009" },
  modalSubtitle: { marginTop: 4, fontSize: 14, color: "#06300999" },
  modalButton: {
    marginTop: 20,
    width: "100%",
    borderRadius: 999,
    backgroundColor: "#ff4f3f",
    paddingVertical: 12,
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  button: {
    marginTop: 12,
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  buttonOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#ff4f3f" },
  buttonOutlineText: { color: "#ff4f3f", fontSize: 14, fontWeight: "700" },
  waitlistText: { fontSize: 12, color: "#06300999", marginBottom: 8, lineHeight: 17 },
});
