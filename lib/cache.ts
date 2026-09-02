const cache = new Map<string, unknown>();

/** Cache en memoria, vive mientras la app esté abierta (sobrevive cambios
 * de pestaña, no sobrevive cerrar la app). Sirve para mostrar de una vez lo
 * último que se cargó mientras se pide la versión fresca en segundo plano,
 * en vez de mostrar una pantalla de carga cada vez que vuelves a una
 * pestaña que ya habías visitado. */
export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCached<T>(key: string, value: T): void {
  cache.set(key, value);
}
