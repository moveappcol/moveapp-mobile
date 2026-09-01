export type CreditPlan = { id: string; name?: string; label: string; credits: number; price: number };

export const CREDIT_PLANS: CreditPlan[] = [
  { id: "plan-starter", name: "Starter", label: "32 créditos", credits: 32, price: 230_000 },
  { id: "plan-balance", name: "Balance", label: "64 créditos", credits: 64, price: 415_000 },
  { id: "plan-volume", name: "Volume", label: "100 créditos", credits: 100, price: 600_000 },
];

export const CREDIT_TOPUPS: CreditPlan[] = [
  { id: "topup-5", label: "5 créditos", credits: 5, price: 45_000 },
  { id: "topup-10", label: "10 créditos", credits: 10, price: 85_000 },
  { id: "topup-15", label: "15 créditos", credits: 15, price: 120_000 },
];

export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
