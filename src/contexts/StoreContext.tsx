import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CURRENT_STORE_STORAGE_KEY = "specifica.currentStoreId";
const DEFAULT_STORE_SLUG = "especifica-principal";

export type StoreRole = "store_admin" | "manager" | "seller" | "financial" | "architect";
type DatabaseStoreRole = StoreRole | "finance" | "viewer";
type StoreMemberStatus = "active" | "inactive" | "invited" | "pending" | "suspended";
type StoreStatus = "active" | "inactive" | "trial" | "suspended" | "pending_setup" | "cancelled";
type GlobalRole = "super_admin" | "user";

export interface Store {
  id: string;
  name: string;
  display_name: string | null;
  slug: string;
  status: StoreStatus;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  text_color: string | null;
  theme_mode: "light" | "dark" | "system";
}

export interface StoreMember {
  store_id: string;
  user_id: string;
  role: DatabaseStoreRole;
  status: StoreMemberStatus;
}

export interface AccessibleStore extends Store {
  member: StoreMember | null;
}

export interface CurrentStoreContext {
  stores: AccessibleStore[];
  currentStore: AccessibleStore | null;
  currentStoreId: string | null;
  currentMember: StoreMember | null;
  currentRole: DatabaseStoreRole | null;
  isSuperAdmin: boolean;
  isStoreAdmin: boolean;
  isManager: boolean;
  isSeller: boolean;
  isArchitect: boolean;
  setCurrentStoreId: (storeId: string | null) => void;
  loading: boolean;
  error: string | null;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<CurrentStoreContext | undefined>(undefined);
const supabaseAny = supabase as any;

function getSavedStoreId() {
  try {
    return window.localStorage.getItem(CURRENT_STORE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveStoreId(storeId: string | null) {
  try {
    if (storeId) {
      window.localStorage.setItem(CURRENT_STORE_STORAGE_KEY, storeId);
    } else {
      window.localStorage.removeItem(CURRENT_STORE_STORAGE_KEY);
    }
  } catch {
    // Local storage can be unavailable in private browsing modes.
  }
}

function normalizeStoreRole(role: DatabaseStoreRole | null): DatabaseStoreRole | null {
  if (!role) return null;
  if (role === "finance") return "financial";
  return role;
}

function pickCurrentStoreId(stores: AccessibleStore[], savedStoreId: string | null) {
  if (!stores.length) return null;
  if (savedStoreId && stores.some(store => store.id === savedStoreId)) return savedStoreId;
  if (stores.length === 1) return stores[0].id;

  const defaultStore = stores.find(store => store.slug === DEFAULT_STORE_SLUG);
  return defaultStore?.id ?? stores[0].id;
}

async function fetchProfileRole(userId: string): Promise<GlobalRole> {
  const { data, error } = await supabaseAny
    .from("profiles")
    .select("global_role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.global_role === "super_admin" ? "super_admin" : "user";
}

async function fetchStoresForSuperAdmin(userId: string): Promise<AccessibleStore[]> {
  const [{ data: stores, error: storesError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabaseAny
      .from("stores")
      .select("id, name, display_name, slug, status, logo_url, favicon_url, primary_color, secondary_color, accent_color, background_color, text_color, theme_mode")
      .in("status", ["active", "trial", "pending_setup"])
      .order("name", { ascending: true }),
    supabaseAny
      .from("store_members")
      .select("store_id, user_id, role, status")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);

  if (storesError) throw storesError;
  if (membershipsError) throw membershipsError;

  const membershipByStore = new Map<string, StoreMember>(
    (memberships ?? []).map((membership: StoreMember) => [membership.store_id, membership])
  );

  return (stores ?? []).map((store: Store) => ({
    ...store,
    member: membershipByStore.get(store.id) ?? null,
  }));
}

async function fetchStoresForMember(userId: string): Promise<AccessibleStore[]> {
  const { data: memberships, error: membershipsError } = await supabaseAny
    .from("store_members")
    .select("store_id, user_id, role, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipsError) throw membershipsError;

  const activeMemberships = (memberships ?? []) as StoreMember[];
  const storeIds = activeMemberships.map(membership => membership.store_id);
  if (!storeIds.length) return [];

  const { data: stores, error: storesError } = await supabaseAny
    .from("stores")
    .select("id, name, display_name, slug, status, logo_url, favicon_url, primary_color, secondary_color, accent_color, background_color, text_color, theme_mode")
    .in("id", storeIds)
    .in("status", ["active", "trial", "pending_setup"])
    .order("name", { ascending: true });

  if (storesError) throw storesError;

  const membershipByStore = new Map<string, StoreMember>(
    activeMemberships.map(membership => [membership.store_id, membership])
  );

  return (stores ?? []).map((store: Store) => ({
    ...store,
    member: membershipByStore.get(store.id) ?? null,
  }));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<AccessibleStore[]>([]);
  const [currentStoreIdState, setCurrentStoreIdState] = useState<string | null>(null);
  const [globalRole, setGlobalRole] = useState<GlobalRole>("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadStores = useCallback(async () => {
    const nextRequestId = ++requestId.current;

    if (authLoading) return;

    if (!user) {
      setStores([]);
      setCurrentStoreIdState(null);
      setGlobalRole("user");
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextGlobalRole = await fetchProfileRole(user.id);
      const nextStores =
        nextGlobalRole === "super_admin"
          ? await fetchStoresForSuperAdmin(user.id)
          : await fetchStoresForMember(user.id);

      if (nextRequestId !== requestId.current) return;

      const nextStoreId = pickCurrentStoreId(nextStores, getSavedStoreId());

      setGlobalRole(nextGlobalRole);
      setStores(nextStores);
      setCurrentStoreIdState(nextStoreId);
      saveStoreId(nextStoreId);
      setLoading(false);
    } catch (err) {
      if (nextRequestId !== requestId.current) return;

      console.error("Store context load failed:", err);
      setStores([]);
      setCurrentStoreIdState(null);
      setError("Nao foi possivel carregar as lojas disponiveis.");
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  const setCurrentStoreId = useCallback(
    (storeId: string | null) => {
      const validStoreId = storeId && stores.some(store => store.id === storeId) ? storeId : null;
      setCurrentStoreIdState(validStoreId);
      saveStoreId(validStoreId);
    },
    [stores]
  );

  const currentStore = useMemo(
    () => stores.find(store => store.id === currentStoreIdState) ?? null,
    [currentStoreIdState, stores]
  );

  const currentMember = currentStore?.member ?? null;
  const currentRole = normalizeStoreRole(currentMember?.role ?? null);
  const isSuperAdmin = globalRole === "super_admin";
  const isStoreAdmin = currentRole === "store_admin";
  const isManager = currentRole === "manager";
  const isSeller = currentRole === "seller";
  const isArchitect = currentRole === "architect";

  const value = useMemo<CurrentStoreContext>(
    () => ({
      stores,
      currentStore,
      currentStoreId: currentStoreIdState,
      currentMember,
      currentRole,
      isSuperAdmin,
      isStoreAdmin,
      isManager,
      isSeller,
      isArchitect,
      setCurrentStoreId,
      loading,
      error,
      refreshStores: loadStores,
    }),
    [
      stores,
      currentStore,
      currentStoreIdState,
      currentMember,
      currentRole,
      isSuperAdmin,
      isStoreAdmin,
      isManager,
      isSeller,
      isArchitect,
      setCurrentStoreId,
      loading,
      error,
      loadStores,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}

export function useCurrentStore() {
  return useStore().currentStore;
}

export function useStoreRole() {
  return useStore().currentRole;
}

export function useCanManageStore() {
  const { isSuperAdmin, isStoreAdmin, isManager } = useStore();
  return isSuperAdmin || isStoreAdmin || isManager;
}
