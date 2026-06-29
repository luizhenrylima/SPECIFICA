import { useEffect, useMemo, useState } from "react";
import { listPlans, listStores, type MasterStore, type StoreStatus } from "@/services/storesService";

export function useStores() {
  const [stores, setStores] = useState<MasterStore[]>([]);
  const [plans, setPlans] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StoreStatus | "all">("all");
  const [plan, setPlan] = useState<string>("all");

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStores, nextPlans] = await Promise.all([listStores(), listPlans()]);
      setStores(nextStores);
      setPlans(nextPlans);
    } catch (err) {
      console.error("Failed to load stores:", err);
      setError("Nao foi possivel carregar as lojas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stores.filter((store) => {
      const matchesSearch = !term || store.name.toLowerCase().includes(term) || store.slug.toLowerCase().includes(term);
      const matchesStatus = status === "all" || store.status === status;
      const matchesPlan = plan === "all" || (store.plan ?? "") === plan;
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [plan, search, status, stores]);

  return {
    stores,
    filteredStores,
    plans,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    plan,
    setPlan,
    reload,
  };
}
