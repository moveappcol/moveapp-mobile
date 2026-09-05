const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/mobile";
// Airtable reintenta sola cuando la limitan (5 peticiones/seg por base,
// fijo en todos los planes), con espera progresiva — bajo mucha carga esa
// espera puede acercarse a 15s, así que dejamos margen extra antes de
// darnos por vencidos.
const TIMEOUT_MS = 25_000;

export async function apiFetch<T>(
  path: string,
  token?: string | null,
  options?: { method?: "GET" | "POST" | "DELETE"; body?: unknown }
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options?.method ?? "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const message = json?.error ?? `API error ${res.status}`;
      throw new Error(message);
    }

    return json as T;
  } finally {
    clearTimeout(timeout);
  }
}
