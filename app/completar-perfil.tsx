import { useAuth, useUser } from "@clerk/expo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "@/lib/api";
import { GENEROS, TIPOS_DOCUMENTO } from "@/lib/documento";

type PerfilActual = {
  perfilCompleto: boolean;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  tipoDocumento: string | null;
  cedula: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  terminosAceptados: boolean;
  tratamientoDatosAceptado: boolean;
  marketingAceptado: boolean;
};

function parseFechaISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const HOY = new Date();
const FECHA_MAX_18_ANOS = new Date(HOY.getFullYear() - 18, HOY.getMonth(), HOY.getDate());
const FECHA_MIN = new Date(1920, 0, 1);

function formatFechaISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatFechaLegible(d: Date): string {
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

type SaveResult = { ok: true } | { ok: false; error: string };

export default function CompletarPerfilScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [nombre, setNombre] = useState(user?.firstName ?? "");
  const [apellido, setApellido] = useState(user?.lastName ?? "");
  const [telefono, setTelefono] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<string | null>(null);
  const [cedula, setCedula] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [genero, setGenero] = useState<string | null>(null);
  const [tratamientoDatosAceptado, setTratamientoDatosAceptado] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [marketingAceptado, setMarketingAceptado] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [yaEstabaCompleto, setYaEstabaCompleto] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const perfil = await apiFetch<PerfilActual>("/me/credits", token);
        setYaEstabaCompleto(perfil.perfilCompleto);
        if (perfil.nombre) setNombre(perfil.nombre);
        if (perfil.apellido) setApellido(perfil.apellido);
        if (perfil.telefono) setTelefono(perfil.telefono);
        if (perfil.tipoDocumento) setTipoDocumento(perfil.tipoDocumento);
        if (perfil.cedula) setCedula(perfil.cedula);
        if (perfil.fechaNacimiento) setFechaNacimiento(parseFechaISO(perfil.fechaNacimiento));
        if (perfil.genero) setGenero(perfil.genero);
        setTerminosAceptados(perfil.terminosAceptados);
        setTratamientoDatosAceptado(perfil.tratamientoDatosAceptado);
        setMarketingAceptado(perfil.marketingAceptado);
      } catch {
        // si falla, se queda con los valores en blanco / de Clerk — la
        // persona puede llenar todo de nuevo sin problema
      } finally {
        setLoadingPerfil(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, []);

  async function handleSubmit() {
    if (!fechaNacimiento) {
      setError("Elige tu fecha de nacimiento.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const result = await apiFetch<SaveResult>("/completar-perfil", token, {
        method: "POST",
        body: {
          nombre,
          apellido,
          telefono,
          tipoDocumento,
          cedula,
          fechaNacimiento: formatFechaISO(fechaNacimiento),
          genero,
          terminosAceptados,
          tratamientoDatosAceptado,
          marketingAceptado,
        },
      });

      if (result.ok) {
        if (yaEstabaCompleto) {
          router.back();
        } else {
          router.replace("/");
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar tu perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPerfil) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Perfil" }} />
        <View style={styles.centerLoading}>
          <ActivityIndicator />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: yaEstabaCompleto ? "Editar perfil" : "Completa tu perfil",
          headerBackVisible: yaEstabaCompleto,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {!yaEstabaCompleto && (
          <Pressable onPress={() => router.replace("/")} hitSlop={10} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Completar después</Text>
          </Pressable>
        )}

        <Text style={styles.subtitle}>
          {yaEstabaCompleto
            ? "Actualiza tus datos personales."
            : "Necesitamos estos datos para poder identificarte en cada reserva. Solo te los pedimos una vez."}
        </Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

        <Text style={styles.label}>Apellido</Text>
        <TextInput style={styles.input} value={apellido} onChangeText={setApellido} />

        <Text style={styles.label}>Número de teléfono</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />

        <Text style={styles.label}>Tipo de documento</Text>
        <View style={styles.chipRow}>
          {TIPOS_DOCUMENTO.map((tipo) => (
            <Pressable
              key={tipo}
              onPress={() => setTipoDocumento(tipo)}
              style={[styles.chip, tipoDocumento === tipo && styles.chipActive]}
            >
              <Text style={[styles.chipText, tipoDocumento === tipo && styles.chipTextActive]}>
                {tipo}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Número de documento</Text>
        <TextInput style={styles.input} value={cedula} onChangeText={setCedula} />

        <Text style={styles.label}>Fecha de nacimiento</Text>
        <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={fechaNacimiento ? styles.dateText : styles.datePlaceholder}>
            {fechaNacimiento ? formatFechaLegible(fechaNacimiento) : "Toca para elegir tu fecha"}
          </Text>
        </Pressable>
        {showDatePicker && (
          <>
            <DateTimePicker
              value={fechaNacimiento ?? FECHA_MAX_18_ANOS}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={FECHA_MAX_18_ANOS}
              minimumDate={FECHA_MIN}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") setShowDatePicker(false);
                if (event.type === "set" && selectedDate) setFechaNacimiento(selectedDate);
              }}
            />
            {Platform.OS === "ios" && (
              <Pressable style={styles.doneButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.doneButtonText}>Listo</Text>
              </Pressable>
            )}
          </>
        )}
        <Text style={styles.hint}>UNIQUE es solo para mayores de 18 años.</Text>

        <Text style={styles.label}>Género</Text>
        <View style={styles.chipRow}>
          {GENEROS.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGenero(g)}
              style={[styles.chip, genero === g && styles.chipActive]}
            >
              <Text style={[styles.chipText, genero === g && styles.chipTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.consentRow}>
          <Switch value={tratamientoDatosAceptado} onValueChange={setTratamientoDatosAceptado} />
          <Text style={styles.consentText}>
            He leído y acepto la{" "}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL("https://www.uniqueappcol.com/tratamiento-datos")}
            >
              Política de Tratamiento de Datos Personales
            </Text>{" "}
            de UNIQUE.
          </Text>
        </View>

        <View style={styles.consentRow}>
          <Switch value={terminosAceptados} onValueChange={setTerminosAceptados} />
          <Text style={styles.consentText}>
            He leído y acepto los{" "}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL("https://www.uniqueappcol.com/terminos")}
            >
              Términos y Condiciones de Uso
            </Text>{" "}
            de UNIQUE.
          </Text>
        </View>

        <View style={styles.consentRow}>
          <Switch value={marketingAceptado} onValueChange={setMarketingAceptado} />
          <Text style={styles.consentText}>
            Autorizo a UNIQUE a contactarme con fines comerciales y promocionales al correo o
            teléfono que registré.
          </Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          disabled={submitting}
          onPress={handleSubmit}
          style={[styles.button, submitting && styles.buttonDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{yaEstabaCompleto ? "Guardar cambios" : "Continuar"}</Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  centerLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
  skipButton: { alignSelf: "flex-end", marginBottom: 12 },
  skipButtonText: { fontSize: 13, fontWeight: "700", color: "#ff4f3f" },
  subtitle: { fontSize: 13, color: "#06300999", lineHeight: 19, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#063009", marginTop: 16, marginBottom: 6 },
  hint: { fontSize: 11, color: "#06300977", marginTop: 6 },
  dateText: { fontSize: 15, color: "#063009" },
  datePlaceholder: { fontSize: 15, color: "#06300966" },
  doneButton: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 16 },
  doneButtonText: { color: "#ff4f3f", fontSize: 15, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#063009",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: "#063009", borderColor: "#063009" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#063009" },
  chipTextActive: { color: "#fff" },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 16 },
  consentText: { flex: 1, fontSize: 12, color: "#06300999", lineHeight: 18 },
  link: { color: "#ff4f3f", fontWeight: "700" },
  errorText: { color: "#ff4f3f", fontSize: 13, marginTop: 16 },
  button: {
    marginTop: 24,
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
