const WHATSAPP_NUMBER = "573239081272";

/** Mismo número que el botón flotante de WhatsApp de la web — ver
 * src/components/layout/whatsapp-button.tsx en move-app. */
export function whatsappUrl(message = "Hola, tengo una pregunta sobre UNIQUE."): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
