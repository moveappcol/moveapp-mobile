import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "favoritos-gimnasios";

/** Favoritos guardados solo en el dispositivo (no sincronizan entre
 * teléfonos) — evita tener que agregar backend para un v1. */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setFavorites(raw ? JSON.parse(raw) : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggleFavorite = useCallback((gymId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(gymId) ? prev.filter((id) => id !== gymId) : [...prev, gymId];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavorite = useCallback((gymId: string) => favorites.includes(gymId), [favorites]);

  return { favorites, loaded, toggleFavorite, isFavorite };
}
