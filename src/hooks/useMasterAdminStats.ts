import { useEffect, useState } from "react";
import { getMasterAdminStats, type MasterAdminStats } from "@/services/masterAdminService";

export function useMasterAdminStats() {
  const [stats, setStats] = useState<MasterAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await getMasterAdminStats());
    } catch (err) {
      console.error("Failed to load master admin stats:", err);
      setError("Nao foi possivel carregar os indicadores do painel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return { stats, loading, error, reload };
}
