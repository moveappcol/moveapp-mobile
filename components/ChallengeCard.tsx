import { useAuth } from "@clerk/expo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";

type Reto = { id: string; titulo: string; actual: number; meta: number; completado: boolean };
type Challenge =
  | { disponible: false }
  | {
      disponible: true;
      congelado: boolean;
      lanzado: boolean;
      ronda: number;
      retos: Reto[];
      completados: number;
      pase: { id: string; fechaVence: string } | null;
      pista: string | null;
    };

function fechaLarga(fechaISO: string): string {
  return new Date(`${fechaISO}T12:00:00-05:00`).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function ChuloDorado() {
  return (
    <View style={styles.chulo}>
      <Text style={styles.chuloText}>✓</Text>
    </View>
  );
}

/** Challenge UNIQUE en el Perfil (mismo diseño que en la web): 4 barras con
 * su chulo dorado, el círculo del regalo que se llena, y la clase gratis
 * cuando la gana. Se recarga cada vez que se entra al Perfil — evaluarlo en
 * el servidor también lo completa si ya llenó los 4 retos. */
export default function ChallengeCard() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Challenge | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      (async () => {
        try {
          const token = await getToken();
          const res = await apiFetch<Challenge>("/me/challenge", token);
          if (vivo) setData(res);
        } catch {
          // si falla, simplemente no se muestra la tarjeta
        }
      })();
      return () => {
        vivo = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  if (!data || !data.disponible) return null;
  const faltan = 4 - data.completados;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>CHALLENGE</Text>
      <Text style={styles.sub}>
        {data.lanzado
          ? "Completa los 4 retos y gana una clase gratis donde quieras."
          : "Arranca el lunes 24 de noviembre: completa los 4 retos y gana una clase gratis."}
      </Text>

      {data.pase && (
        <View style={styles.won}>
          <Text style={styles.wonEmoji}>🎁</Text>
          <Text style={styles.wonTitle}>¡Ganaste una clase gratis!</Text>
          <Text style={styles.wonBody}>
            Úsala en la clase que quieras, en cualquier gimnasio. No gasta tus créditos.
          </Text>
          <Text style={styles.wonVence}>⏳ Vence el {fechaLarga(data.pase.fechaVence)}</Text>
          <Pressable style={styles.wonButton} onPress={() => router.push("/(tabs)")}>
            <Text style={styles.wonButtonText}>Reservar mi clase gratis</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.prize}>
        <View style={styles.ring}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.ringSeg, styles[`seg${i}` as "seg0"], i < data.completados && styles.ringSegOn]}
            />
          ))}
          <View style={styles.ringIn}>
            <Text style={{ fontSize: 22 }}>🎁</Text>
            <Text style={styles.ringCount}>{data.completados} de 4</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.prizeTitle}>Te ganas una clase con UNIQUE</Text>
          <Text style={styles.prizeSub}>
            {data.congelado
              ? "Tu challenge está en pausa: renueva tu plan para seguir avanzando."
              : faltan === 0
                ? "¡Completado!"
                : `Te ${faltan === 1 ? "falta 1 reto" : `faltan ${faltan} retos`}`}
          </Text>
        </View>
      </View>

      {data.retos.map((r) => (
        <View key={r.id} style={styles.reto}>
          <Text style={styles.retoTitle}>{r.titulo}</Text>
          <View style={styles.barRow}>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.max(r.actual === 0 ? 4 : 0, (r.actual / r.meta) * 100)}%` },
                ]}
              />
            </View>
            {r.completado ? <ChuloDorado /> : <View style={styles.chuloOff} />}
          </View>
          {r.meta > 1 && (
            <View style={styles.steps}>
              {Array.from({ length: r.meta }, (_, i) => (
                <Text key={i} style={[styles.step, i < r.actual && styles.stepOn]}>
                  {i + 1}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}

      {data.pista && data.lanzado && <Text style={styles.pista}>{data.pista}</Text>}
      <Text style={styles.nota}>
        Cuentan las clases que reservas y no cancelas. Al completar los 4 retos, el challenge vuelve a empezar.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#063009", borderRadius: 24, padding: 20, marginTop: 16 },
  title: { color: "#FF4F3F", fontSize: 34, fontWeight: "900", fontFamily: "Georgia", letterSpacing: 1 },
  sub: { color: "#ffffffb3", fontSize: 13, marginTop: 4 },
  won: { marginTop: 16, backgroundColor: "#fff3c4", borderRadius: 20, padding: 18, alignItems: "center" },
  wonEmoji: { fontSize: 40 },
  wonTitle: { color: "#063009", fontSize: 19, fontWeight: "900", marginTop: 4 },
  wonBody: { color: "#063009b3", fontSize: 13, textAlign: "center", marginTop: 4 },
  wonVence: {
    marginTop: 10,
    backgroundColor: "#063009",
    color: "#D4FF3F",
    fontWeight: "800",
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  wonButton: { marginTop: 12, backgroundColor: "#FF4F3F", borderRadius: 999, paddingVertical: 12, alignSelf: "stretch", alignItems: "center" },
  wonButtonText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  prize: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: "#ffffff0f",
    borderColor: "#ffffff1f",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  ring: { width: 80, height: 80, borderRadius: 40, overflow: "hidden", backgroundColor: "#ffffff26" },
  ringSeg: { position: "absolute", width: 40, height: 40, backgroundColor: "transparent" },
  seg0: { top: 0, right: 0 },
  seg1: { bottom: 0, right: 0 },
  seg2: { bottom: 0, left: 0 },
  seg3: { top: 0, left: 0 },
  ringSegOn: { backgroundColor: "#D4FF3F" },
  ringIn: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  ringCount: { color: "#063009", fontSize: 11, fontWeight: "900" },
  prizeTitle: { color: "#fff", fontSize: 15, fontWeight: "900" },
  prizeSub: { color: "#ffffffa6", fontSize: 12, marginTop: 2 },
  reto: { marginTop: 14 },
  retoTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  track: { flex: 1, height: 16, borderRadius: 999, backgroundColor: "#ffffff26", overflow: "hidden" },
  fill: { height: 16, borderRadius: 999, backgroundColor: "#FF4F3F" },
  chulo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e6b94c",
    borderWidth: 2,
    borderColor: "#f7d774",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f7d774",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  chuloText: { color: "#063009", fontSize: 18, fontWeight: "900" },
  chuloOff: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderStyle: "dashed", borderColor: "#ffffff40" },
  steps: { flexDirection: "row", justifyContent: "space-between", paddingRight: 48, paddingLeft: 2, marginTop: 4 },
  step: { color: "#ffffff55", fontSize: 12, fontWeight: "900" },
  stepOn: { color: "#D4FF3F" },
  pista: {
    marginTop: 16,
    backgroundColor: "#D4FF3F",
    color: "#063009",
    borderRadius: 14,
    padding: 10,
    fontSize: 13,
    fontWeight: "800",
    overflow: "hidden",
  },
  nota: { color: "#ffffff80", fontSize: 11.5, marginTop: 12, lineHeight: 16 },
});
