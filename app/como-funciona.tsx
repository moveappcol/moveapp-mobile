import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { CREDIT_PLANS, CREDIT_TOPUPS, formatCOP } from "@/lib/credits-pricing";
import { whatsappUrl } from "@/lib/whatsapp";

type Step = { n: number; title: string; body: string[] };

const STEPS: Step[] = [
  {
    n: 1,
    title: "Elige tu plan de créditos",
    body: [
      "En UNIQUE no pagas por un solo gimnasio, pagas por un paquete de créditos mensual. Tienes tres planes — Starter, Balance o Volume — y eliges el que más se adapte a cuánto entrenas al mes.",
      "Si en algún mes se te acaban los créditos de tu plan, puedes comprar créditos adicionales (top-ups) sin cambiar de plan, siempre que ya tengas una suscripción activa.",
    ],
  },
  {
    n: 2,
    title: "Mira qué clase quieres tomar y cuánto cuesta",
    body: [
      "Cada gimnasio y cada clase tiene su propio costo en créditos — no es el mismo valor en todos lados. Antes de reservar, siempre puedes ver exactamente cuántos créditos te va a costar esa clase específica, así que nunca hay sorpresas ni cobros ocultos.",
    ],
  },
  {
    n: 3,
    title: "Reserva y entrena donde quieras",
    body: [
      "Con esos créditos accedes a toda la red de gimnasios y estudios afiliados a UNIQUE: cycling, boxing, yoga, pilates, funcional y más — reservas la clase que quieras, en el centro aliado que quieras, sin atarte a uno solo.",
      "Dos límites que vale la pena conocer: para promover que conozcas variedad de la red, hay un máximo de 3 reservas por gimnasio al mes; y algunos gimnasios son exclusivos para un género (lo vas a ver indicado en su perfil antes de reservar).",
    ],
  },
  {
    n: 4,
    title: "Tus créditos se renuevan cada mes",
    body: [
      "Tu plan se cobra una vez al mes y, junto con ese cobro, tus créditos se renuevan automáticamente. La idea es usarlos dentro de ese mes — los créditos no se acumulan de un ciclo a otro.",
    ],
  },
];

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
    a: "Desde la app puedes ver el directorio de centros aliados, revisar horarios disponibles y reservar tu cupo directamente. Cada clase muestra cuántos créditos necesitas para tomarla, así sabes el costo antes de confirmar.",
  },
  {
    q: "¿Qué pasa si cancelo una clase reservada?",
    a: "Puedes cancelar tu reserva hasta 24 horas antes de la hora de la clase sin que se te cobren los créditos; en ese caso, tus créditos quedan disponibles en tu cuenta para que los uses en otra clase (siempre dentro de la vigencia del mes). Si cancelas después de ese plazo o no asistes, los créditos de esa clase se descuentan igualmente.",
  },
  {
    q: "¿Cómo me registro en UNIQUE?",
    a: "Creas tu cuenta con tus datos básicos, aceptas nuestra Política de Tratamiento de Datos y Términos y Condiciones, y eliges el plan (Starter, Balance o Volume) que más se ajuste a ti.",
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
    q: "¿Puedo comprar créditos sin plan?",
    a: "Sí. Puedes comprar créditos sueltos a $8.000 cada uno, desde 1 crédito, para reservar esa clase o experiencia específica que quieres probar. Tienen vigencia de 1 mes. Si entrenas seguido, los planes te salen más baratos por crédito.",
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

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
            <Pressable onPress={() => Linking.openURL(whatsappUrl())}>
              <Text style={styles.contactLink}>Escríbenos por WhatsApp →</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default function ComoFuncionaScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: "Cómo funciona", headerLeft: () => <BackButton /> }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Cómo funciona</Text>
        <Text style={styles.title}>Un solo plan de créditos, toda la red de gimnasios</Text>
        <Text style={styles.intro}>
          Esta es la guía completa de cómo funciona UNIQUE, paso a paso — desde elegir tu plan
          hasta reservar tu primera clase.
        </Text>

        <View style={styles.stepsList}>
          {STEPS.map((step) => (
            <View key={step.n} style={styles.stepCard}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.n}</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                {step.body.map((p) => (
                  <Text key={p} style={styles.stepBody}>
                    {p}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <Section title="Nuestros planes">
          <View style={styles.planGrid}>
            {CREDIT_PLANS.map((plan) => (
              <View key={plan.id} style={styles.planCard}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planCredits}>{plan.credits} créditos</Text>
                <Text style={styles.planPer}>al mes</Text>
                <Text style={styles.planPrice}>{formatCOP(plan.price)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.paragraph}>
            ¿Se te acabaron los créditos antes de fin de mes? Puedes comprar créditos adicionales
            sin cambiar de plan:{" "}
            {CREDIT_TOPUPS.map((t, i) => (
              <Text key={t.id}>
                {i > 0 && " · "}
                {t.credits} créditos ({formatCOP(t.price)})
              </Text>
            ))}
            .
          </Text>
        </Section>

        <Section title="Cancelaciones y no-shows">
          <Text style={styles.paragraph}>
            Puedes cancelar tu reserva hasta 24 horas antes de la hora de la clase sin que se te
            cobren los créditos — quedan disponibles en tu cuenta para usarlos en otra clase.
          </Text>
          <Text style={styles.paragraph}>
            Si cancelas después de ese plazo, o simplemente no asistes, los créditos de esa clase
            se descuentan igual — el gimnasio ya reservó ese cupo para ti.
          </Text>
        </Section>

        <Section title="Sin permanencia">
          <Text style={styles.paragraph}>
            No hay contratos de largo plazo. Tu plan se renueva mes a mes automáticamente, pero
            puedes cancelarlo cuando quieras desde &quot;Mi suscripción&quot;, sin penalidades.
          </Text>
        </Section>

        <Section title="Métodos de pago">
          <Text style={styles.paragraph}>
            Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), PSE,
            Nequi, Bancolombia y otros medios a través de Wompi, la pasarela de pagos respaldada
            por Bancolombia. Tu información viaja siempre encriptada — UNIQUE nunca almacena los
            datos de tu tarjeta.
          </Text>
        </Section>

        <Section title="Preguntas frecuentes">
          {FAQS.map((item, i) => (
            <FaqItem key={item.q} q={item.q} a={item.a} isLast={i === FAQS.length - 1} />
          ))}
        </Section>

        <View style={styles.ctaBox}>
          <Text style={styles.ctaText}>¿Listo para empezar a entrenar?</Text>
          <Pressable style={styles.ctaButton} onPress={() => router.push("/(tabs)/planes")}>
            <Text style={styles.ctaButtonText}>Ver planes de créditos</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#06300980",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#063009", marginTop: 6 },
  intro: { fontSize: 14, lineHeight: 21, color: "#063009b3", marginTop: 12 },
  stepsList: { marginTop: 24, gap: 12 },
  stepCard: {
    flexDirection: "row",
    gap: 14,
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 20,
    padding: 18,
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff4f3f",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: "800", color: "#063009" },
  stepBody: { fontSize: 13, lineHeight: 20, color: "#063009b3", marginTop: 8 },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#063009", marginBottom: 10 },
  paragraph: { fontSize: 13, lineHeight: 20, color: "#063009b3", marginTop: 8 },
  planGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  planCard: {
    flexGrow: 1,
    minWidth: "30%",
    borderWidth: 1,
    borderColor: "#06300922",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  planName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ff4f3f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planCredits: { fontSize: 16, fontWeight: "800", color: "#063009", marginTop: 6 },
  planPer: { fontSize: 11, color: "#06300999" },
  planPrice: { fontSize: 13, fontWeight: "700", color: "#063009", marginTop: 8 },
  faqItem: { marginTop: 10, borderRadius: 16, overflow: "hidden" },
  faqItemClosed: { backgroundColor: "#063009" },
  faqItemOpen: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#06300922",
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
  faqIcon: { fontSize: 20, color: "#d4ff3f", fontWeight: "600" },
  faqIconOpen: { color: "#ff4f3f" },
  faqAnswerBox: { paddingHorizontal: 18, paddingBottom: 18 },
  faqAnswerText: { fontSize: 13, lineHeight: 20, color: "#063009b3" },
  contactLink: { marginTop: 10, fontSize: 13, fontWeight: "700", color: "#25D366" },
  ctaBox: {
    marginTop: 28,
    backgroundColor: "#063009",
    borderRadius: 20,
    padding: 22,
    alignItems: "flex-start",
    gap: 14,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  ctaButton: { backgroundColor: "#ff4f3f", borderRadius: 999, paddingVertical: 12, paddingHorizontal: 22 },
  ctaButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
