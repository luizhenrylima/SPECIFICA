import { useEffect, useMemo, useState } from "react";
import {
  addStoreUser,
  listStoreUsers,
  removeStoreUser,
  resendStoreUserInvite,
  updateStoreUserRole,
  updateStoreUserStatus,
  type StoreUserFormValues,
  type StoreUserMember,
  type StoreUserRole,
  type StoreUserStatus,
} from "@/services/storeUsersService";

export function useStoreUsers(storeId: string | undefined) {
  const [users, setUsers] = useState<StoreUserMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<StoreUserRole | "all">("all");
  const [status, setStatus] = useState<StoreUserStatus | "all">("all");

  const reload = async () => {
    if (!storeId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setUsers(await listStoreUsers(storeId));
    } catch (err) {
      console.error("Failed to load store users:", err);
      setError("Nao foi possivel carregar os usuarios da loja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [storeId]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const profile = user.profile;
      const haystack = `${profile?.full_name ?? ""} ${profile?.email ?? ""}`.toLowerCase();
      return (!term || haystack.includes(term))
        && (role === "all" || user.role === role)
        && (status === "all" || user.status === status);
    });
  }, [users, search, role, status]);

  return { users, filteredUsers, loading, error, search, setSearch, role, setRole, status, setStatus, reload };
}

function useStoreUserMutation(defaultError: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T,>(callback: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await callback();
    } catch (err: any) {
      const message = err?.message || defaultError;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, run };
}

export function useAddStoreUser() {
  const mutation = useStoreUserMutation("Nao foi possivel adicionar o usuario.");
  return {
    addUser: (storeId: string, values: StoreUserFormValues, actorUserId: string) => mutation.run(() => addStoreUser(storeId, values, actorUserId)),
    loading: mutation.loading,
    error: mutation.error,
  };
}

export function useUpdateStoreUserRole() {
  const mutation = useStoreUserMutation("Nao foi possivel alterar a role.");
  return {
    updateRole: (member: StoreUserMember, role: StoreUserRole, actorUserId: string) => mutation.run(() => updateStoreUserRole(member, role, actorUserId)),
    loading: mutation.loading,
    error: mutation.error,
  };
}

export function useUpdateStoreUserStatus() {
  const mutation = useStoreUserMutation("Nao foi possivel alterar o status.");
  return {
    updateStatus: (member: StoreUserMember, status: StoreUserStatus, actorUserId: string) => mutation.run(() => updateStoreUserStatus(member, status, actorUserId)),
    loading: mutation.loading,
    error: mutation.error,
  };
}

export function useRemoveStoreUser() {
  const mutation = useStoreUserMutation("Nao foi possivel remover o usuario da loja.");
  return {
    removeUser: (member: StoreUserMember, actorUserId: string) => mutation.run(() => removeStoreUser(member, actorUserId)),
    loading: mutation.loading,
    error: mutation.error,
  };
}

export function useResendStoreUserInvite() {
  const mutation = useStoreUserMutation("Nao foi possivel reenviar o convite.");
  return {
    resendInvite: (member: StoreUserMember, actorUserId: string) => mutation.run(() => resendStoreUserInvite(member, actorUserId)),
    loading: mutation.loading,
    error: mutation.error,
  };
}
