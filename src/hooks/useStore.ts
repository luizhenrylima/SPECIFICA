import { useEffect, useState } from "react";
import { getStore, type MasterStore } from "@/services/storesService";

export function useStore(storeId: string | undefined) {
  const [store, setStore] = useState<MasterStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!storeId) {
      setStore(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setStore(await getStore(storeId));
    } catch (err) {
      console.error("Failed to load store:", err);
      setError("Nao foi possivel carregar a loja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [storeId]);

  return { store, loading, error, reload };
}
