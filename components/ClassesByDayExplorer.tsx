import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";
import { getCached, setCached } from "@/lib/cache";
import { precioEfectivo, type Clase } from "@/lib/classes";
import {
  DAY_KEY_FORMATTER,
  semanaActual,
  formatHora,
  bogotaHour,
  formatRangoHorario,
  RANGOS_HORARIO,
  claseYaPaso,
} from "@/lib/dias";

const CACHE_KEY = "clasesPorDia";

type GymInfo = { id: string; name: string; activities: string[] };

type ClasesPorDiaResponse = {
  comingSoon: boolean;
  gyms: GymInfo[];
  classes: Clase[];
  reservedClaseIds: string[];
};

type ScreenState = { loading: boolean; error: string | null; data: ClasesPorDiaResponse | null };

/** Equivalente móvil de ClassesByDayExplorer.tsx en la web — mismo criterio
 * de filtrado (clases sin cupo se esconden salvo que la persona ya las
 * tenga reservadas), incluido el filtro de rango de horario. */
export default function ClassesByDayExplorer() {
  const cached = getCached<ClasesPorDiaResponse>(CACHE_KEY);
  const [state, setState] = useState<ScreenState>({
    loading: !cached,
    error: null,
    data: cached ?? null,
  });
  const semana = useMemo(() => semanaActual(), []);
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => semana[0].key);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<string | null>(null);
  const [rangoSeleccionado, setRangoSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ClasesPorDiaResponse>("/clases-por-dia")
      .then((data) => {
        setCached(CACHE_KEY, data);
        setState({ loading: false, error: null, data });
      })
      .catch(() => {
        if (!cached) {
          setState({ loading: false, error: "No pudimos cargar las clases.", data: null });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gymsById = useMemo(() => {
    const map: Record<string, GymInfo> = {};
    for (const g of state.data?.gyms ?? []) map[g.id] = g;
    return map;
  }, [state.data]);

  const activityOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...(state.data?.classes ?? []).map((c) => c.actividad).filter((a): a is string => a !== null),
          ...Object.values(gymsById).flatMap((g) => g.activities),
        ])
      ).sort(),
    [state.data, gymsById]
  );

  const diaActivo = semana.find((d) => d.key === diaSeleccionado) ?? semana[0];
  const rangoActivo = RANGOS_HORARIO.find((r) => r.key === rangoSeleccionado) ?? null;
  const reservedSet = useMemo(
    () => new Set(state.data?.reservedClaseIds ?? []),
    [state.data]
  );

  const clasesDelDia = useMemo(() => {
    return (state.data?.classes ?? [])
      .filter((c) => {
        if (!c.fecha) return false;
        if (DAY_KEY_FORMATTER.format(new Date(c.fecha)) !== diaActivo.key) return false;
        if (claseYaPaso(c.fecha)) return false;
        if (!reservedSet.has(c.id) && c.cuposDisponibles <= 0) return false;

        if (actividadSeleccionada) {
          const gym = c.gimnasioId ? gymsById[c.gimnasioId] : undefined;
          const coincide = c.actividad
            ? c.actividad === actividadSeleccionada
            : (gym?.activities.includes(actividadSeleccionada) ?? false);
          if (!coincide) return false;
        }

        if (rangoActivo) {
          const hora = bogotaHour(c.fecha);
          if (hora < rangoActivo.startHour || hora >= rangoActivo.endHour) return false;
        }

        return true;
      })
      .sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""));
  }, [state.data, diaActivo, actividadSeleccionada, rangoActivo, gymsById, reservedSet]);

  if (state.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#063009" />
      </View>
    );
  }

  if (state.error) {
    return <Text style={styles.errorText}>{state.error}</Text>;
  }

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diaRow}>
        {semana.map((dia) => (
          <Pressable
            key={dia.key}
            style={[styles.diaChip, diaSeleccionado === dia.key && styles.diaChipActive]}
            onPress={() => setDiaSeleccionado(dia.key)}
          >
            <Text style={[styles.diaChipLabel, diaSeleccionado === dia.key && styles.diaChipLabelActive]}>
              {dia.label.slice(0, 3)}
            </Text>
            <Text style={[styles.diaChipFecha, diaSeleccionado === dia.key && styles.diaChipFechaActive]}>
              {dia.fechaLabel}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {activityOptions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <Pressable
            onPress={() => setActividadSeleccionada(null)}
            style={[styles.chip, actividadSeleccionada === null && styles.chipActive]}
          >
            <Text style={[styles.chipText, actividadSeleccionada === null && styles.chipTextActive]}>
              Todas
            </Text>
          </Pressable>
          {activityOptions.map((activity) => {
            const active = actividadSeleccionada === activity;
            return (
              <Pressable
                key={activity}
                onPress={() => setActividadSeleccionada(active ? null : activity)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{activity}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <Pressable
          onPress={() => setRangoSeleccionado(null)}
          style={[styles.rangoChip, rangoSeleccionado === null && styles.rangoChipActive]}
        >
          <Text style={[styles.rangoChipText, rangoSeleccionado === null && styles.rangoChipTextActive]}>
            Todos los horarios
          </Text>
        </Pressable>
        {RANGOS_HORARIO.map((rango) => {
          const active = rangoSeleccionado === rango.key;
          return (
            <Pressable
              key={rango.key}
              onPress={() => setRangoSeleccionado(active ? null : rango.key)}
              style={[styles.rangoChip, active && styles.rangoChipActive]}
            >
              <Text style={[styles.rangoChipText, active && styles.rangoChipTextActive]}>
                {formatRangoHorario(rango)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.list}>
        {clasesDelDia.length === 0 ? (
          <Text style={styles.empty}>No hay clases programadas para este día.</Text>
        ) : (
          clasesDelDia.map((clase) => {
            const gym = clase.gimnasioId ? gymsById[clase.gimnasioId] : undefined;
            const yaReservada = reservedSet.has(clase.id);
            return (
              <Link
                key={clase.id}
                href={{ pathname: "/gimnasios/[id]", params: { id: clase.gimnasioId ?? "", clase: clase.id } }}
                asChild
              >
                <Pressable style={styles.card}>
                  <Text style={styles.cardGym}>{gym?.name ?? "Gimnasio"}</Text>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{clase.name}</Text>
                      <Text style={styles.cardSubtitle}>
                        {clase.fecha ? formatHora(clase.fecha) : "Hora por confirmar"}
                      </Text>
                    </View>
                    <View style={styles.creditsBadge}>
                      {precioEfectivo(clase) < clase.credits && (
                        <Text style={styles.creditsStrikethrough}>{clase.credits} </Text>
                      )}
                      <Text style={styles.creditsBadgeText}>{precioEfectivo(clase)} créditos</Text>
                    </View>
                  </View>
                  {clase.descripcion && (
                    <Text style={styles.cardDescripcion} numberOfLines={2}>
                      {clase.descripcion}
                    </Text>
                  )}
                  <Text style={styles.cardStatus}>
                    {yaReservada
                      ? "Ya reservaste esta clase"
                      : clase.cuposDisponibles <= 2
                        ? clase.cuposDisponibles === 1
                          ? "Último cupo disponible"
                          : "Últimos 2 cupos disponibles"
                        : "Cupos disponibles"}
                  </Text>
                </Pressable>
              </Link>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 32, alignItems: "center" },
  errorText: { color: "#ff4f3f", fontSize: 14 },
  diaRow: { marginTop: 4, flexGrow: 0 },
  diaChip: {
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "#0630090d",
  },
  diaChipActive: { backgroundColor: "#063009" },
  diaChipLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", color: "#063009b3" },
  diaChipLabelActive: { color: "#fff" },
  diaChipFecha: { fontSize: 10, color: "#06300980", marginTop: 1 },
  diaChipFechaActive: { color: "#ffffffcc" },
  chipRow: { marginTop: 10, flexGrow: 0 },
  chip: {
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#ff4f3f", borderColor: "#ff4f3f" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#06300999" },
  chipTextActive: { color: "#fff" },
  rangoChip: {
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
    marginRight: 8,
  },
  rangoChipActive: { backgroundColor: "#063009", borderColor: "#063009" },
  rangoChipText: { fontSize: 12, fontWeight: "700", color: "#06300999" },
  rangoChipTextActive: { color: "#fff" },
  list: { marginTop: 16, gap: 12 },
  empty: { fontSize: 13, color: "#06300999" },
  card: { borderWidth: 1, borderColor: "#06300922", borderRadius: 18, padding: 16 },
  cardGym: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#ff4f3f",
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#063009" },
  cardSubtitle: { fontSize: 13, color: "#06300999", marginTop: 2 },
  creditsBadge: {
    flexDirection: "row",
    backgroundColor: "#ff4f3f1a",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  creditsBadgeText: { color: "#ff4f3f", fontSize: 11, fontWeight: "700" },
  creditsStrikethrough: { color: "#06300966", fontSize: 11, textDecorationLine: "line-through" },
  cardDescripcion: { fontSize: 12, color: "#063009b3", marginTop: 8 },
  cardStatus: { fontSize: 12, fontWeight: "600", color: "#063009b3", marginTop: 10 },
});
