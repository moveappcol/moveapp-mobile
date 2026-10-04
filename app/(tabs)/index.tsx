import * as Location from "expo-location";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "@/lib/api";
import { getCached, setCached } from "@/lib/cache";
import { distanceKm } from "@/lib/geo";
import { Skeleton } from "@/components/Skeleton";
import { useFavorites } from "@/lib/favorites";
import ClassesByDayExplorer from "@/components/ClassesByDayExplorer";

const CACHE_KEY = "gyms";

type Gym = {
  id: string;
  name: string;
  city: string;
  address: string;
  activities: string[];
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  genero: "todos" | "solo_mujeres" | "solo_hombres";
};

type GymsResponse = { comingSoon: boolean; gyms: Gym[] };

type ScreenState = { loading: boolean; error: string | null; data: GymsResponse | null };

type GeoStatus = "idle" | "loading" | "denied" | "unsupported" | "success";

function SearchIcon() {
  return (
    <View style={styles.searchIcon}>
      <Text style={{ fontSize: 14 }}>🔍</Text>
    </View>
  );
}

function GymCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={styles.photoWrap as object} />
      <View style={styles.cardBody}>
        <Skeleton style={{ height: 15, width: "70%", borderRadius: 4 }} />
        <Skeleton style={{ height: 12, width: "50%", borderRadius: 4, marginTop: 8 }} />
        <Skeleton style={{ height: 12, width: "85%", borderRadius: 4, marginTop: 6 }} />
      </View>
    </View>
  );
}

/** Empieza a pedir el detalle del gimnasio apenas el dedo toca la tarjeta
 * (antes de que se complete el tap/la navegación) y lo deja en caché, para
 * que cuando la pantalla de detalle monte ya tenga los datos listos. */
function prefetchGym(id: string) {
  apiFetch<unknown>(`/gimnasios/${id}`)
    .then((data) => setCached(`gimnasio:${id}`, data))
    .catch(() => {});
}

export default function GimnasiosScreen() {
  const cached = getCached<GymsResponse>(CACHE_KEY);
  const [state, setState] = useState<ScreenState>({
    loading: !cached,
    error: null,
    data: cached ?? null,
  });
  const [query, setQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [modo, setModo] = useState<"gimnasio" | "dia">("gimnasio");

  useEffect(() => {
    apiFetch<GymsResponse>("/gyms")
      .then((data) => {
        setCached(CACHE_KEY, data);
        setState({ loading: false, error: null, data });
      })
      .catch(() => {
        if (!cached) {
          setState({ loading: false, error: "No pudimos cargar los gimnasios.", data: null });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    for (const gym of state.data?.gyms ?? []) {
      if (gym.photoUrl) Image.prefetch(gym.photoUrl);
    }
  }, [state.data]);

  async function useMyLocation() {
    setGeoStatus("loading");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGeoStatus("denied");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      setGeoStatus("success");
    } catch {
      setGeoStatus("unsupported");
    }
  }

  function toggleActivity(activity: string) {
    setSelectedActivity((prev) => (prev === activity ? null : activity));
  }

  const gyms = state.data?.gyms ?? [];

  const activityOptions = useMemo(
    () => Array.from(new Set(gyms.flatMap((g) => g.activities))).sort(),
    [gyms]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = gyms
      .filter((gym) =>
        selectedActivity === null ? true : gym.activities.includes(selectedActivity)
      )
      .filter((gym) =>
        q === ""
          ? true
          : [gym.name, gym.city, gym.address].some((f) => f.toLowerCase().includes(q))
      )
      .filter((gym) => (onlyFavorites ? isFavorite(gym.id) : true))
      .map((gym) => ({
        ...gym,
        distance:
          userLocation && gym.lat !== null && gym.lng !== null
            ? distanceKm(userLocation, { lat: gym.lat, lng: gym.lng })
            : null,
      }));

    if (userLocation) {
      list = list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return list;
  }, [gyms, query, selectedActivity, userLocation, onlyFavorites, isFavorite]);

  if (state.loading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.wordmark}>UNIQUE</Text>
        <Text style={styles.title}>Gimnasios afiliados</Text>
        <View style={styles.list}>
          <GymCardSkeleton />
          <GymCardSkeleton />
          <GymCardSkeleton />
        </View>
      </ScrollView>
    );
  }

  if (state.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{state.error}</Text>
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

  const topHeader = (
    <>
      <Text style={styles.wordmark}>UNIQUE</Text>
      <Text style={styles.title}>Gimnasios afiliados</Text>
      <Text style={styles.subtitle}>
        {modo === "gimnasio"
          ? "Busca gimnasios cerca de ti y filtra por actividad"
          : "Mira qué clases hay cada día en toda la red"}
      </Text>

      <View style={styles.modeToggle}>
        <Pressable
          onPress={() => setModo("gimnasio")}
          style={[styles.modeButton, modo === "gimnasio" && styles.modeButtonActive]}
        >
          <Text style={[styles.modeButtonText, modo === "gimnasio" && styles.modeButtonTextActive]}>
            Por gimnasio
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setModo("dia")}
          style={[styles.modeButton, modo === "dia" && styles.modeButtonActive]}
        >
          <Text style={[styles.modeButtonText, modo === "dia" && styles.modeButtonTextActive]}>
            Por día
          </Text>
        </Pressable>
      </View>
    </>
  );

  const gymFilters = (
    <>
      <View style={styles.searchBar}>
        <SearchIcon />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar gimnasio..."
          placeholderTextColor="#06300966"
          style={styles.searchInput}
        />
      </View>

      <Pressable style={styles.cityButton} onPress={() => setShowCityPicker((v) => !v)}>
        <Text style={styles.cityPin}>📍</Text>
        <Text style={styles.cityButtonText}>Bogotá</Text>
        <Text style={styles.cityChevron}>{showCityPicker ? "▲" : "▼"}</Text>
      </Pressable>

      {showCityPicker && (
        <View style={styles.cityPicker}>
          <View style={styles.cityPickerActive}>
            <Text style={styles.cityPickerActiveText}>Bogotá</Text>
            <Text style={styles.cityPickerCheck}>✓</Text>
          </View>
          <Text style={styles.cityPickerNote}>Muy pronto más ciudades</Text>
        </View>
      )}

      {activityOptions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <Pressable
            onPress={() => setOnlyFavorites((v) => !v)}
            style={[styles.chip, onlyFavorites && styles.chipActive]}
          >
            <Text style={[styles.chipText, onlyFavorites && styles.chipTextActive]}>
              ♥ Favoritos
            </Text>
          </Pressable>
          {activityOptions.map((activity) => {
            const active = selectedActivity === activity;
            return (
              <Pressable
                key={activity}
                onPress={() => toggleActivity(activity)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{activity}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {geoStatus === "success" && userLocation ? (
        <View style={styles.locationBox}>
          <Text style={styles.locationBoxText}>📍 Usando tu ubicación — Bogotá</Text>
        </View>
      ) : (
        <View style={styles.locationPrompt}>
          <Text style={styles.locationPromptText}>
            Activa tu ubicación para ver qué tan cerca están los gimnasios
          </Text>
          <Pressable style={styles.locationButton} onPress={useMyLocation} disabled={geoStatus === "loading"}>
            <Text style={styles.locationButtonText}>
              {geoStatus === "loading" ? "Buscando…" : "Continuar"}
            </Text>
          </Pressable>
          {geoStatus === "denied" && (
            <Text style={styles.locationError}>
              No pudimos acceder a tu ubicación. Revisa los permisos de la app.
            </Text>
          )}
        </View>
      )}
    </>
  );

  if (modo === "dia") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        {topHeader}
        <ClassesByDayExplorer />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {topHeader}
      {gymFilters}

      <View style={styles.list}>
        {results.map((gym) => {
          const generoLabel =
            gym.genero === "solo_mujeres"
              ? "Gimnasio exclusivo para mujeres"
              : gym.genero === "solo_hombres"
                ? "Gimnasio exclusivo para hombres"
                : null;
          return (
            <Link key={gym.id} href={`/gimnasios/${gym.id}`} asChild>
              <Pressable style={styles.card} onPressIn={() => prefetchGym(gym.id)}>
                <View style={styles.photoWrap}>
                  {gym.photoUrl ? (
                    <Image source={{ uri: gym.photoUrl }} style={styles.photo} />
                  ) : (
                    <Text style={styles.photoPlaceholder}>Foto próximamente</Text>
                  )}
                  <Pressable
                    style={styles.favoriteButton}
                    hitSlop={10}
                    onPress={() => toggleFavorite(gym.id)}
                  >
                    <Text style={styles.favoriteIcon}>{isFavorite(gym.id) ? "♥" : "♡"}</Text>
                  </Pressable>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{gym.name.trim()}</Text>
                    {gym.distance !== null && (
                      <Text style={styles.cardDistance}>
                        {gym.distance < 1
                          ? `${Math.round(gym.distance * 1000)} m`
                          : `${gym.distance.toFixed(1)} km`}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.cardSubtitle}>{gym.activities.join(", ")}</Text>
                  <Text style={styles.cardAddress}>{gym.address}</Text>
                  {generoLabel && (
                    <View style={styles.generoBadge}>
                      <Text style={styles.generoBadgeText}>{generoLabel}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Link>
          );
        })}

        {results.length === 0 && (
          <Text style={styles.subtitle}>No encontramos gimnasios con esos filtros.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  container: { padding: 20, paddingBottom: 40 },
  errorText: { color: "#ff4f3f", fontSize: 15 },
  comingSoon: { fontSize: 24, fontWeight: "800", color: "#ff4f3f", textTransform: "uppercase" },
  wordmark: { fontSize: 15, fontWeight: "700", color: "#063009" },
  title: { fontSize: 20, fontWeight: "800", color: "#063009", marginTop: 10 },
  subtitle: { fontSize: 13, color: "#06300999", marginTop: 4 },
  modeToggle: {
    flexDirection: "row",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 999,
    padding: 3,
    marginTop: 14,
  },
  modeButton: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16 },
  modeButtonActive: { backgroundColor: "#063009" },
  modeButtonText: { fontSize: 12, fontWeight: "700", color: "#06300999" },
  modeButtonTextActive: { color: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  searchIcon: { width: 16, alignItems: "center" },
  searchInput: { flex: 1, fontSize: 14, color: "#063009" },
  cityButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#06300908",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  cityPin: { fontSize: 12 },
  cityButtonText: { fontSize: 12, fontWeight: "700", color: "#063009" },
  cityChevron: { fontSize: 9, color: "#063009" },
  cityPicker: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 14,
    padding: 6,
  },
  cityPickerActive: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#06300908",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cityPickerActiveText: { fontSize: 13, fontWeight: "700", color: "#063009" },
  cityPickerCheck: { color: "#ff4f3f", fontWeight: "700" },
  cityPickerNote: { fontSize: 13, color: "#06300977", padding: 10 },
  chipRow: { marginTop: 14, flexGrow: 0 },
  chip: {
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#ff4f3f", borderColor: "#ff4f3f" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#06300999" },
  chipTextActive: { color: "#fff" },
  locationPrompt: {
    marginTop: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#06300933",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  locationPromptText: { fontSize: 13, color: "#06300999", textAlign: "center", marginBottom: 10 },
  locationButton: {
    backgroundColor: "#063009",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  locationButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  locationError: { color: "#ff4f3f", fontSize: 12, marginTop: 8, textAlign: "center" },
  locationBox: {
    marginTop: 16,
    backgroundColor: "#06300908",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  locationBoxText: { fontSize: 12, fontWeight: "700", color: "#063009" },
  list: { marginTop: 20, gap: 14 },
  card: { borderWidth: 1, borderColor: "#06300922", borderRadius: 18, overflow: "hidden" },
  photoWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#0630090d",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  photo: { width: "100%", height: "100%" },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#00000055",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteIcon: { color: "#fff", fontSize: 17, lineHeight: 19 },
  photoPlaceholder: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#06300966",
  },
  cardBody: { padding: 14 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#063009" },
  cardDistance: { fontSize: 12, fontWeight: "700", color: "#ff4f3f" },
  cardSubtitle: { fontSize: 13, color: "#06300999", marginTop: 3 },
  cardAddress: { fontSize: 12, color: "#0630097a", marginTop: 2 },
  generoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ff4f3f1a",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
    marginTop: 8,
  },
  generoBadgeText: {
    color: "#ff4f3f",
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
