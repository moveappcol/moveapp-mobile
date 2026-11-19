import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export type MetodoPago = "tarjeta" | "nequi";

/** Selector Tarjeta / Nequi para los checkouts que guardan un medio de
 * pago (plan, Prueba UNIQUE, créditos sueltos). */
export function MetodoPagoToggle({ metodo, setMetodo }: { metodo: MetodoPago; setMetodo: (m: MetodoPago) => void }) {
  return (
    <View style={styles.row}>
      {(["tarjeta", "nequi"] as const).map((m) => (
        <Pressable key={m} onPress={() => setMetodo(m)} style={[styles.btn, metodo === m && styles.btnOn]}>
          <Text style={[styles.text, metodo === m && styles.textOn]}>{m === "tarjeta" ? "Tarjeta" : "Nequi"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function NequiFields({
  telefono,
  setTelefono,
  esperando,
  ayuda,
}: {
  telefono: string;
  setTelefono: (v: string) => void;
  esperando: boolean;
  ayuda: string;
}) {
  return (
    <>
      <Text style={styles.label}>Celular de tu cuenta Nequi</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        placeholder="300 123 4567"
        placeholderTextColor="#06300966"
        value={telefono}
        onChangeText={setTelefono}
      />
      <Text style={styles.hint}>{ayuda}</Text>
      {esperando && (
        <Text style={styles.esperando}>
          📲 Abre tu app de Nequi y acepta la solicitud de UNIQUE. Cuando vuelvas, terminamos el pago.
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, backgroundColor: "#0630090d", borderRadius: 999, padding: 4, marginTop: 8, marginBottom: 4 },
  btn: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: "center" },
  btnOn: { backgroundColor: "#063009" },
  text: { color: "#063009b3", fontWeight: "700", fontSize: 14 },
  textOn: { color: "#fff" },
  label: { fontSize: 13, fontWeight: "600", color: "#063009", marginTop: 12 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#06300933",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#063009",
  },
  hint: { fontSize: 12, color: "#06300999", marginTop: 6, lineHeight: 17 },
  esperando: {
    marginTop: 10,
    backgroundColor: "#D4FF3F66",
    color: "#063009",
    fontWeight: "700",
    fontSize: 13,
    padding: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
});
