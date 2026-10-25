export type CreditPlan = { id: string; name?: string; label: string; credits: number; price: number };

export const CREDIT_PLANS: CreditPlan[] = [
  { id: "plan-starter", name: "Starter", label: "32 créditos", credits: 32, price: 209_900 },
  { id: "plan-balance", name: "Balance", label: "64 créditos", credits: 64, price: 384_900 },
  { id: "plan-volume", name: "Volume", label: "100 créditos", credits: 100, price: 569_900 },
];

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
