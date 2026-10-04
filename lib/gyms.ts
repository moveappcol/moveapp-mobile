/** Las Experiencias de UNIQUE (eventos propios, no clases de un aliado) se
 * publican como un gimnasio más en Airtable — se identifica por nombre en
 * vez de por id, para no depender de que quede creado con un id fijo.
 * Mismo criterio que la web (src/lib/gyms.ts) — mantener sincronizado. */
export function esGimnasioDeExperiencias(nombre: string): boolean {
  return nombre.toLowerCase().includes("experiencia");
}
