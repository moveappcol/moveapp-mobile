import * as TrackingTransparency from "expo-tracking-transparency";

/** Pide el permiso de App Tracking Transparency (requerido por Apple porque
 * le mandamos el correo del comprador a Meta para medir anuncios). Devuelve
 * true solo si la persona lo permitió explícitamente — cualquier otro
 * resultado (denegado, restringido, no determinado por error) se trata como
 * "no permitido" para no arriesgarnos a rastrear sin autorización. */
export async function requestTrackingConsent(): Promise<boolean> {
  try {
    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}
