export type Clase = {
  id: string;
  name: string;
  credits: number;
  descuentoCreditos: number | null;
  cuposTotales: number;
  cuposDisponibles: number;
  fecha: string | null;
  duracionMinutos: number;
  descripcion: string | null;
  gimnasioId: string | null;
  actividad: string | null;
  /** true si todavía no se puede reservar (se anuncia antes de abrir
   * cupos) — mientras sea true, la UI siempre muestra "Avísame cuando
   * pueda reservar" en vez de Reservar/clase llena, sin importar los
   * cupos. Ver el mismo campo en el backend (src/lib/classes.ts). */
  proximamente: boolean;
};

export function precioEfectivo(clase: Pick<Clase, "credits" | "descuentoCreditos">): number {
  return clase.descuentoCreditos !== null && clase.descuentoCreditos < clase.credits
    ? clase.descuentoCreditos
    : clase.credits;
}
