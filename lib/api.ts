const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/mobile";
const TIMEOUT_MS = 15_000;

export async function apiFetch<T>(
  path: string,
  token?: string | null,
  options?: { method?: "GET" | "POST"; body?: unknown }
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
