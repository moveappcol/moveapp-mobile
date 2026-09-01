import { useAuth, useUser } from "@clerk/expo";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState<string | null>(null);
  const [tratamientoDatosAceptado, setTratamientoDatosAceptado] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [marketingAceptado, setMarketingAceptado] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
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
          fechaNacimiento,
          genero,
          terminosAceptados,
          tratamientoDatosAceptado,
          marketingAceptado,
        },
      });

      if (result.ok) {
        router.replace("/");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar tu perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Completa tu perfil", headerBackVisible: false }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>
          Necesitamos estos datos para poder identificarte en cada reserva. Solo te los pedimos
          una vez.
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
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          keyboardType="number-pad"
          value={fechaNacimiento}
          onChangeText={setFechaNacimiento}
        />
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
            <Text style={styles.buttonText}>Continuar</Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  subtitle: { fontSize: 13, color: "#06300999", lineHeight: 19, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#063009", marginTop: 16, marginBottom: 6 },
  hint: { fontSize: 11, color: "#06300977", marginTop: 6 },
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
