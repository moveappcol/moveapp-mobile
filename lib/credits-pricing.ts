export type CreditPlan = { id: string; name?: string; label: string; credits: number; price: number };

export const CREDIT_PLANS: CreditPlan[] = [
  { id: "plan-starter", name: "Starter", label: "32 créditos", credits: 32, price: 209_900 },
  { id: "plan-balance", name: "Balance", label: "64 créditos", credits: 64, price: 384_900 },
  { id: "plan-volume", name: "Volume", label: "100 créditos", credits: 100, price: 569_900 },
];

export const CREDIT_TOPUPS: CreditPlan[] = [
  { id: "topup-5", label: "5 créditos", credits: 5, price: 39_900 },
  { id: "topup-10", label: "10 créditos", credits: 10, price: 74_900 },
  { id: "topup-15", label: "15 créditos", credits: 15, price: 109_900 },
];

/** Créditos sueltos: mismo cálculo que precioCreditosSueltos en el repo
 * web (src/lib/credits-pricing.ts) — mantener sincronizado si cambia. */
export const PRECIO_CREDITO_SUELTO = 8_000;
export const CARGO_OPERATIVO_UMBRAL_CREDITOS = 3;
export const CARGO_OPERATIVO_CREDITOS_SUELTOS = 2_000;

export function precioCreditosSueltos(cantidad: number): number {
  const base = cantidad * PRECIO_CREDITO_SUELTO;
  return cantidad < CARGO_OPERATIVO_UMBRAL_CREDITOS ? base + CARGO_OPERATIVO_CREDITOS_SUELTOS : base;
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
