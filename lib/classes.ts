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
};

export function precioEfectivo(clase: Pick<Clase, "credits" | "descuentoCreditos">): number {
  return clase.descuentoCreditos !== null && clase.descuentoCreditos < clase.credits
    ? clase.descuentoCreditos
    : clase.credits;
}
