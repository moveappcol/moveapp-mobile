import { useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const FAQS: { q: string; a: string }[] = [
  {
    q: "¿Cuántas clases puedo tomar al mes?",
    a: "Depende de cuántos créditos tenga tu plan y del costo en créditos de cada clase (que varía según el gimnasio). En promedio, un paquete típico alcanza para varias clases al mes, repartidas entre los distintos centros aliados que elijas.",
  },
  {
    q: "¿Puedo ir varias veces al mismo gimnasio?",
    a: "Sí, aunque para promover la diversidad de la red y dar espacio a todos nuestros aliados, existe un límite de hasta 3 visitas mensuales por gimnasio dentro de tu plan.",
  },
  {
    q: "¿En qué ciudades está disponible UNIQUE?",
    a: "Por ahora, UNIQUE opera en Bogotá, donde estamos construyendo nuestra red de gimnasios y estudios aliados. Próximamente en más ciudades del país.",
  },
  {
    q: "¿Cómo elijo y reservo una clase?",
    a: "Desde la plataforma puedes ver el directorio de centros aliados, revisar horarios disponibles y reservar tu cupo directamente. Cada clase muestra cuántos créditos necesitas para tomarla, así sabes el costo antes de confirmar.",
  },
  {
    q: "¿Qué pasa si cancelo una clase reservada?",
    a: "Puedes cancelar tu reserva hasta 24 horas antes de la hora de la clase sin que se te cobren los créditos; en ese caso, tus créditos quedan disponibles en tu cuenta para que los uses en otra clase (siempre dentro de la vigencia del mes). Si cancelas después de ese plazo o no asistes, los créditos de esa clase se descuentan igualmente.",
  },
  {
    q: "¿Cómo me registro en UNIQUE?",
    a: "Creas tu cuenta desde la plataforma con tus datos básicos, aceptas nuestra Política de Tratamiento de Datos y Términos y Condiciones, y eliges el plan (Starter, Balance o Volume) que más se ajuste a ti.",
  },
  {
    q: "¿Cómo se maneja mi información personal?",
    a: "Tu información se maneja conforme a la Ley 1581 de Protección de Datos Personales. Solo compartimos con los gimnasios los datos necesarios para tu asistencia a las clases, y tú decides si quieres recibir comunicaciones promocionales — esa opción nunca viene marcada por defecto, y puedes desactivarla cuando quieras desde tu cuenta.",
  },
  {
    q: "¿Qué métodos de pago acepta UNIQUE?",
    a: "En UNIQUE puedes pagar como prefieras: tarjetas de crédito y débito (Visa, Mastercard, American Express), PSE, Nequi, Bancolombia y otros medios disponibles a través de Wompi, la pasarela de pagos respaldada por Bancolombia. Tu información viaja siempre encriptada y UNIQUE nunca almacena los datos de tu tarjeta — tus pagos son 100% seguros, de principio a fin.",
  },
  {
    q: "¿Tengo que firmar un contrato a largo plazo?",
    a: "No. UNIQUE está pensado para darte flexibilidad: adquieres tu plan de créditos según lo que elijas, sin permanencias forzosas de largo plazo, puedes cancelar tu plan cuando quieras.",
  },
  {
    q: "Tengo un gimnasio o estudio y quiero ser aliado de UNIQUE, ¿cómo hago?",
    a: "Nos encantaría conocerte. Escríbenos a través del formulario de contacto en nuestra página web y nos pondremos en contacto.",
  },
  {
    q: "¿Con quién hablo si tengo un problema o una pregunta?",
    a: "Puedes contactar a nuestro equipo de soporte a través del formulario de contacto en nuestra página web, te responderemos lo más rápido posible. Estamos para ayudarte a que tu experiencia con UNIQUE sea la mejor.",
  },
];

const COMO_FUNCIONA = [
  "En la plataforma puedes comprar distintos planes: Starter, Balance o Volume, el que más se adapte a ti. Cada plan te entrega un paquete de créditos mensual.",
  "Con los créditos que obtengas vas a poder acceder a todos los gimnasios de la plataforma: los usas para reservar la clase que quieras, en el centro aliado que quieras, sin atarte a uno solo.",
  "Cada gimnasio puede tener un costo de créditos diferente por clase — antes de reservar, siempre puedes ver cuántos créditos vale cada clase en cada centro, así que sabes exactamente cuánto te cuesta antes de confirmar.",
  "Puedes cancelar tu clase hasta 24 horas antes de la hora reservada sin que se te cobren los créditos. Si cancelas después de ese plazo, o no asistes, los créditos de esa clase sí se descuentan de tu cuenta.",
  "Los créditos tienen una vigencia de 1 mes: se renuevan cada ciclo junto con tu plan, así que la idea es usarlos dentro de ese mes para aprovechar al máximo tu membresía.",
];

const QUIENES_SOMOS = [
  "Somos una plataforma que sabe que cada persona es única.",
  "Creemos que no existe una sola manera de entrenar. Por eso, a través de UNIQUE puedes explorar diferentes disciplinas en distintos gimnasios y estudios de la ciudad, hasta encontrar esa rutina que se adapta a TI.",
  "Con UNIQUE, tus créditos son tu llave. Los usas donde quieras, cuando quieras, y descubres experiencias de entrenamiento que antes solo veías desde afuera.",
  "No creemos en el entrenamiento único para todos. Creemos en la libertad de moverte a tu manera — y en construir, junto a los centros de entrenamiento que confían en nosotros, una forma más flexible, honesta y humana de cuidar tu bienestar.",
  "Esto apenas comienza. UNIQUE nace en Bogotá con la convicción de que el movimiento nos hace mejores personas, y con el compromiso de hacerlo accesible para más gente cada día.",
];

const CONTACT_URL = "https://www.uniqueappcol.com/#contacto";

function FaqItem({ q, a, isLast }: { q: string; a: string; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.faqItem, open ? styles.faqItemOpen : styles.faqItemClosed]}>
      <Pressable style={styles.faqQuestion} onPress={() => setOpen((v) => !v)}>
        <Text style={[styles.faqQuestionText, open && styles.faqQuestionTextOpen]}>{q}</Text>
        <Text style={[styles.faqIcon, open && styles.faqIconOpen]}>{open ? "×" : "+"}</Text>
      </Pressable>
      {open && (
        <View style={styles.faqAnswerBox}>
          <Text style={styles.faqAnswerText}>{a}</Text>
          {isLast && (
            <Pressable onPress={() => Linking.openURL(CONTACT_URL)}>
              <Text style={styles.contactLink}>Ir al formulario de contacto →</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default function NosotrosScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require("@/assets/icon.png")} style={styles.logo} />

      <Text style={styles.eyebrow}>Sobre nosotros</Text>
      <Text style={styles.title}>UNIQUE — Quiénes somos</Text>

      <View style={styles.paragraphGroup}>
        {QUIENES_SOMOS.map((p) => (
          <Text key={p} style={styles.paragraph}>
            {p}
          </Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
      <View style={styles.paragraphGroup}>
        {COMO_FUNCIONA.map((p) => (
          <Text key={p} style={styles.paragraph}>
            {p}
          </Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
      <View>
        {FAQS.map((item, i) => (
          <FaqItem key={item.q} q={item.q} a={item.a} isLast={i === FAQS.length - 1} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  logo: { width: 56, height: 56, borderRadius: 14, marginBottom: 16 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#06300980",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#063009", marginTop: 6 },
  paragraphGroup: { marginTop: 16, gap: 12 },
  paragraph: { fontSize: 14, lineHeight: 21, color: "#063009cc" },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#063009", marginTop: 32, marginBottom: 4 },
  faqItem: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  faqItemClosed: { backgroundColor: "#063009" },
  faqItemOpen: {
    backgroundColor: "#fff",
    shadowColor: "#063009",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  faqQuestionText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#fff", marginRight: 12 },
  faqQuestionTextOpen: { color: "#063009" },
  faqIcon: { fontSize: 20, color: "#9be36b", fontWeight: "600" },
  faqIconOpen: { color: "#ff4f3f" },
  faqAnswerBox: { paddingHorizontal: 18, paddingBottom: 18 },
  faqAnswerText: { fontSize: 13, lineHeight: 20, color: "#063009b3" },
  contactLink: { marginTop: 10, fontSize: 13, fontWeight: "700", color: "#ff4f3f" },
});
