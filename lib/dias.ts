export const DAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" });

const NOMBRES_DIA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export type DiaTab = { key: string; label: string; fechaLabel: string };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const DIAS_VISIBLES = 7;

/** Los gimnasios recién están cargando las clases desde el lunes 28 de
 * septiembre de 2026 en adelante — antes de esa fecha, la ventana normal
 * (arrancando en "hoy") le mostraría a cualquiera que entre varios días
 * seguidos sin ninguna clase. Mientras tanto, la ventana arranca directo en
 * ese lunes, que sí tiene clases. Se autodesactiva sola: en cuanto llegue
 * el 28, "hoy" ya es esa fecha o una posterior y esta rama nunca se toma —
 * no hay que acordarse de quitarlo después. Mismo valor que web
 * (src/lib/dias.ts) — mantener sincronizado. */
const VENTANA_DESDE = Date.UTC(2026, 8, 28);

/** Ventana rodante: "Hoy" primero, seguido de los siguientes 6 días —
 * siempre 7 días hacia adelante sin importar qué día de la semana sea hoy
 * (antes se cortaba en el domingo de esta semana, lo que escondía una
 * clase cargada, por ejemplo, un miércoles para el martes siguiente hasta
 * que llegara el lunes). Se recalcula solo con la fecha de hoy, así que
 * rueda sola sin ningún cambio de código. Toda la aritmética es en UTC "de
 * calendario" (sin horas) para no depender de la zona horaria del
 * teléfono. */
export function semanaActual(): DiaTab[] {
  const [yStr, mStr, dStr] = DAY_KEY_FORMATTER.format(new Date()).split("-");
  const hoyUTC = Date.UTC(Number(yStr), Number(mStr) - 1, Number(dStr));
  const baseUTC = hoyUTC < VENTANA_DESDE ? VENTANA_DESDE : hoyUTC;
  const diaSemanaISO = (new Date(baseUTC).getUTCDay() + 6) % 7; // lunes=0 ... domingo=6

  return Array.from({ length: DIAS_VISIBLES }, (_, i) => {
    const fecha = new Date(baseUTC + i * 86_400_000);
    const y = fecha.getUTCFullYear();
    const m = fecha.getUTCMonth() + 1;
    const d = fecha.getUTCDate();
    const key = `${y}-${pad(m)}-${pad(d)}`;
    const nombre = NOMBRES_DIA[(diaSemanaISO + i) % 7];
    const esHoyReal = baseUTC === hoyUTC && i === 0;
    return { key, label: esHoyReal ? "Hoy" : nombre, fechaLabel: `${d} de ${NOMBRES_MES[m - 1]}` };
  });
}

export function formatHora(fecha: string): string {
  return new Date(fecha).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Fecha completa con día de la semana (ej. "sábado 18 de octubre") — para
 * listas que no viven dentro de una ventana de 7 días (ver "modo plano" del
 * gimnasio de Experiencias), donde no alcanza con mostrar solo la hora
 * porque no hay un día de referencia implícito. */
export function formatFechaLarga(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const BOGOTA_HOUR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Bogota",
  hour: "numeric",
  hour12: false,
});

/** Hora del día (0–23) de una fecha, en hora de Bogotá — para agrupar
 * clases en rangos horarios (5–7, 7–10, etc.) sin depender de la zona
 * horaria del teléfono. Mismo criterio que web (src/lib/dias.ts). */
export function bogotaHour(fecha: string): number {
  return Number(BOGOTA_HOUR_FORMATTER.format(new Date(fecha)));
}

export type RangoHorario = { key: string; startHour: number; endHour: number };

/** Rangos fijos para el filtro de horario del explorador "por día" — mismo
 * criterio que web: cubren de 5 a.m. a 10 p.m., la ventana real en que los
 * gimnasios afiliados programan clases. */
export const RANGOS_HORARIO: RangoHorario[] = [
  { key: "5-7", startHour: 5, endHour: 7 },
  { key: "7-10", startHour: 7, endHour: 10 },
  { key: "10-13", startHour: 10, endHour: 13 },
  { key: "13-16", startHour: 13, endHour: 16 },
  { key: "16-19", startHour: 16, endHour: 19 },
  { key: "19-22", startHour: 19, endHour: 22 },
];

/** Bogotá no tiene horario de verano (siempre UTC-5), así que basta con
 * construir la hora directamente en UTC+5 para representar esa hora
 * "de reloj" en Bogotá, sin pasar por el huso horario del teléfono. */
function formatHourLabel(hour: number): string {
  const d = new Date(Date.UTC(2000, 0, 1, hour + 5, 0));
  return d
    .toLocaleTimeString("es-CO", { timeZone: "America/Bogota", hour: "numeric" })
    .replace(/\s?[ap]\.?\s?m\.?/i, (m) => m.trim().toLowerCase());
}

export function formatRangoHorario(rango: RangoHorario): string {
  return `${formatHourLabel(rango.startHour)} – ${formatHourLabel(rango.endHour)}`;
}

/** A medida que avanza el día, las clases cuya hora ya pasó dejan de
 * mostrarse en las listas — ej. a las 11am ya no tiene sentido seguir
 * viendo la clase de las 5am del mismo día. Mismo criterio que web
 * (src/lib/dias.ts). */
export function claseYaPaso(fecha: string): boolean {
  return new Date(fecha).getTime() <= Date.now();
}
