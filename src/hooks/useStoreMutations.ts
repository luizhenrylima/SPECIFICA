import { useState } from "react";
import { createStore, updateStore, updateStoreStatus, type StoreFormValues, type StoreStatus } from "@/services/storesService";

export function useCreateStore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (values: StoreFormValues, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await createStore(values, userId);
    } catch (err: any) {
      const message = err?.message || "Nao foi possivel criar a loja.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createStore: mutate, loading, error };
}

export function useUpdateStore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (storeId: string, values: StoreFormValues, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await updateStore(storeId, values, userId);
    } catch (err: any) {
      const message = err?.message || "Nao foi possivel atualizar a loja.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (storeId: string, status: StoreStatus, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await updateStoreStatus(storeId, status, userId);
    } catch (err: any) {
      const message = err?.message || "Nao foi possivel alterar o status da loja.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateStore: mutate, updateStoreStatus: setStatus, loading, error };
}
