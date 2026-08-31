const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/mobile";
const TIMEOUT_MS = 15_000;

export async function apiFetch<T>(path: string, token?: string | null): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}
