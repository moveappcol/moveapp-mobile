export type CreditPlan = { id: string; name?: string; label: string; credits: number; price: number };

export const CREDIT_PLANS: CreditPlan[] = [
  { id: "plan-starter", name: "Starter", label: "32 créditos", credits: 32, price: 209_900 },
  { id: "plan-balance", name: "Balance", label: "64 créditos", credits: 64, price: 384_900 },
  { id: "plan-volume", name: "Volume", label: "100 créditos", credits: 100, price: 569_900 },
];

/** Mismo cálculo que ahorroPorcentaje en el repo web
 * (src/lib/credits-pricing.ts) — mantener sincronizado si cambia. Precio
 * de referencia de mercado: lo que costaría pagar cada clase suelta en el
 * gimnasio, sin plan. */
export const PRECIO_CLASE_SUELTA_POR_CREDITO = 10_000;

export function ahorroPorcentaje(plan: CreditPlan): number {
  const precioPorCreditoPlan = plan.price / plan.credits;
  return Math.round((1 - precioPorCreditoPlan / PRECIO_CLASE_SUELTA_POR_CREDITO) * 100);
}

/** Créditos sueltos: mismo cálculo que precioCreditosSueltos en el repo
 * web (src/lib/credits-pricing.ts) — mantener sincronizado si cambia.
 * Mínimo de 3 créditos (no desde 1): precio siempre exacto, sin cargo
 * operativo aparte para compras chicas. */
export const PRECIO_CREDITO_SUELTO = 8_000;
export const MINIMO_CREDITOS_SUELTOS = 3;

export function precioCreditosSueltos(cantidad: number): number {
  return cantidad * PRECIO_CREDITO_SUELTO;
}

/** Prueba UNIQUE de 1 semana: mismo TRIAL_PLAN que el repo web
 * (src/lib/credits-pricing.ts) — mantener sincronizado si cambia. */
export const TRIAL_PLAN: CreditPlan = {
  id: "trial-1semana",
  name: "Prueba UNIQUE",
  label: "16 créditos",
  credits: 16,
  price: 69_000,
};
export const TRIAL_DURATION_DAYS = 7;
export const STARTER_PLAN_PRICE = 209_900;

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Black Friday 2026 (20 y 21 de nov, hora Colombia): mismo cálculo que
 * creditosCompraPlan en el repo web (src/lib/credits-pricing.ts) — allá es
 * donde de verdad se acreditan; acá solo se muestra. Solo aplica a la
 * compra de un plan nuevo, no a las renovaciones. */
export const BLACK_FRIDAY = {
  inicio: new Date("2026-11-20T00:00:00-05:00"),
  fin: new Date("2026-11-22T00:00:00-05:00"),
  bonoPorPlan: { "plan-starter": 0.2, "plan-balance": 0.15, "plan-volume": 0.15 } as Record<string, number>,
};

export function esBlackFriday(ahora: Date = new Date()): boolean {
  return ahora >= BLACK_FRIDAY.inicio && ahora < BLACK_FRIDAY.fin;
}

export function bonoBlackFridayPorcentaje(planId: string, ahora: Date = new Date()): number {
  if (!esBlackFriday(ahora)) return 0;
  return Math.round((BLACK_FRIDAY.bonoPorPlan[planId] ?? 0) * 100);
}

export function creditosCompraPlan(plan: CreditPlan, ahora: Date = new Date()): number {
  return Math.round(plan.credits * (1 + bonoBlackFridayPorcentaje(plan.id, ahora) / 100));
}

/** Temporada de Navidad (22 nov – 31 dic, hora Colombia) y tarjeta de
 * regalo — mismos valores que en el repo web (src/lib/credits-pricing.ts),
 * donde de verdad se calcula y se cobra; acá solo se muestra. */
export const NAVIDAD = {
  inicio: new Date("2026-11-22T00:00:00-05:00"),
  fin: new Date("2027-01-01T00:00:00-05:00"),
};

export function esNavidad(ahora: Date = new Date()): boolean {
  return ahora >= NAVIDAD.inicio && ahora < NAVIDAD.fin;
}

export const MESES_REGALO = [1, 2, 3] as const;
export const PRECIO_ENVIO_REGALO_FISICO = 10_000;
export const CIUDAD_REGALO_FISICO = "Bogotá";
