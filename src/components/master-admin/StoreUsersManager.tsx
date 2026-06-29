import { useMemo, useState } from "react";
import { Eye, MailPlus, Plus, RotateCcw, Search, ShieldOff, Trash2, UserRound, UsersRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AdminMetricCard } from "@/components/master-admin/AdminMetricCard";
import { AddStoreUserDialog } from "@/components/master-admin/AddStoreUserDialog";
import { StoreUserRoleBadge } from "@/components/master-admin/StoreUserRoleBadge";
import { StoreUserStatusBadge } from "@/components/master-admin/StoreUserStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAddStoreUser,
  useRemoveStoreUser,
  useResendStoreUserInvite,
  useStoreUsers,
  useUpdateStoreUserRole,
  useUpdateStoreUserStatus,
} from "@/hooks/useStoreUsers";
import {
  STORE_USER_ROLES,
  STORE_USER_STATUSES,
  roleLabel,
  type StoreUserFormValues,
  type StoreUserMember,
  type StoreUserRole,
  type StoreUserStatus,
} from "@/services/storeUsersService";

export function StoreUsersManager({ storeId }: { storeId: string }) {
  const { user } = useAuth();
  const { users, filteredUsers, loading, error, search, setSearch, role, setRole, status, setStatus, reload } = useStoreUsers(storeId);
  const addMutation = useAddStoreUser();
  const roleMutation = useUpdateStoreUserRole();
  const statusMutation = useUpdateStoreUserStatus();
  const removeMutation = useRemoveStoreUser();
  const inviteMutation = useResendStoreUserInvite();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StoreUserMember | null>(null);

  const summary = useMemo(() => ({
    total: users.length,
    admins: users.filter((item) => item.role === "store_admin").length,
    managers: users.filter((item) => item.role === "manager").length,
    sellers: users.filter((item) => item.role === "seller").length,
    financial: users.filter((item) => item.role === "financial").length,
    architects: users.filter((item) => item.role === "architect").length,
    inactive: users.filter((item) => item.status !== "active").length,
  }), [users]);

  const handleAdd = async (values: StoreUserFormValues) => {
    if (!user) return;
    try {
      await addMutation.addUser(storeId, values, user.id);
      await reload();
      setAddOpen(false);
      toast({ title: "Usuario vinculado a loja", description: "O acesso foi registrado para esta loja." });
    } catch (err: any) {
      toast({ title: "Erro ao adicionar usuario", description: err?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const changeRole = async (member: StoreUserMember, nextRole: StoreUserRole) => {
    if (!user || nextRole === member.role) return;
    try {
      await roleMutation.updateRole(member, nextRole, user.id);
      await reload();
      toast({ title: "Role atualizada", description: `${member.profile?.full_name ?? member.profile?.email ?? "Usuario"} agora e ${roleLabel(nextRole)}.` });
    } catch (err: any) {
      toast({ title: "Erro ao alterar role", description: err?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const changeStatus = async (member: StoreUserMember, nextStatus: StoreUserStatus) => {
    if (!user || nextStatus === member.status) return;
    try {
      await statusMutation.updateStatus(member, nextStatus, user.id);
      await reload();
      toast({ title: "Status atualizado" });
    } catch (err: any) {
      toast({ title: "Erro ao alterar status", description: err?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const removeMember = async (member: StoreUserMember) => {
    if (!user) return;
    const label = member.profile?.full_name ?? member.profile?.email ?? "este usuario";
    if (!window.confirm(`Remover ${label} desta loja?`)) return;
    try {
      await removeMutation.removeUser(member, user.id);
      await reload();
      toast({ title: "Usuario removido da loja" });
    } catch (err: any) {
      toast({ title: "Erro ao remover usuario", description: err?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const resendInvite = async (member: StoreUserMember) => {
    if (!user) return;
    try {
      await inviteMutation.resendInvite(member, user.id);
      await reload();
      toast({ title: "Convite marcado para reenvio", description: "O envio automatico de e-mail sera implementado depois." });
    } catch (err: any) {
      toast({ title: "Erro ao reenviar convite", description: err?.message ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const busy = addMutation.loading || roleMutation.loading || statusMutation.loading || removeMutation.loading || inviteMutation.loading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold tracking-normal text-neutral-950">Usuarios da loja</h3>
          <p className="mt-2 text-sm text-neutral-500">Gerencie admins, gerentes, vendedores, financeiro e arquitetos desta loja.</p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <Plus size={16} />
          Adicionar usuario
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={UsersRound} label="Total" value={summary.total} />
        <AdminMetricCard icon={UserRound} label="Admins" value={summary.admins} />
        <AdminMetricCard icon={UserRound} label="Gerentes" value={summary.managers} />
        <AdminMetricCard icon={UserRound} label="Vendedores" value={summary.sellers} />
        <AdminMetricCard icon={UserRound} label="Financeiro" value={summary.financial} />
        <AdminMetricCard icon={UserRound} label="Arquitetos" value={summary.architects} />
        <AdminMetricCard icon={ShieldOff} label="Inativos/Pendentes" value={summary.inactive} />
      </section>

      <section className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="h-10 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-neutral-950"
          />
        </label>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as StoreUserRole | "all")}
          className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
          aria-label="Filtrar por role"
        >
          <option value="all">Todas as roles</option>
          {STORE_USER_ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StoreUserStatus | "all")}
          className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          {STORE_USER_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </section>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-neutral-500">Carregando usuarios...</p>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <UsersRound className="mx-auto text-neutral-300" size={32} />
            <p className="mt-3 text-sm text-neutral-500">Nenhum usuario encontrado para esta loja.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Criado em</th>
                  <th className="px-4 py-3 font-medium">Ultimo acesso</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredUsers.map((member) => (
                  <tr key={member.id} className="align-middle">
                    <td className="px-4 py-4 font-medium text-neutral-950">{member.profile?.full_name || "Sem nome"}</td>
                    <td className="px-4 py-4 text-neutral-600">{member.profile?.email || "-"}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <StoreUserRoleBadge role={member.role} />
                        <select
                          value={member.role}
                          disabled={busy}
                          onChange={(event) => void changeRole(member, event.target.value as StoreUserRole)}
                          className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none transition focus:border-neutral-950"
                          aria-label={`Alterar role de ${member.profile?.full_name ?? member.profile?.email ?? "usuario"}`}
                        >
                          {STORE_USER_ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-4"><StoreUserStatusBadge status={member.status} /></td>
                    <td className="px-4 py-4 text-neutral-500">{new Date(member.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-4 text-neutral-500">{member.profile?.last_login_at ? new Date(member.profile.last_login_at).toLocaleDateString("pt-BR") : "-"}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setSelectedUser(member)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" title="Ver detalhes" aria-label="Ver detalhes">
                          <Eye size={15} />
                        </button>
                        <button type="button" disabled={busy} onClick={() => void changeStatus(member, member.status === "active" ? "inactive" : "active")} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" title={member.status === "active" ? "Inativar" : "Ativar"} aria-label={member.status === "active" ? "Inativar usuario" : "Ativar usuario"}>
                          <RotateCcw size={15} />
                        </button>
                        <button type="button" disabled={busy} onClick={() => void resendInvite(member)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" title="Reenviar convite" aria-label="Reenviar convite">
                          <MailPlus size={15} />
                        </button>
                        <button type="button" disabled={busy} onClick={() => void removeMember(member)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50" title="Remover da loja" aria-label="Remover da loja">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AddStoreUserDialog open={addOpen} loading={addMutation.loading} error={addMutation.error} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
      {selectedUser && <UserDetailsDialog member={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

function UserDetailsDialog({ member, onClose }: { member: StoreUserMember; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
      <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-950">{member.profile?.full_name || "Usuario"}</h3>
            <p className="mt-1 text-sm text-neutral-500">{member.profile?.email || "Sem e-mail cadastrado"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            Fechar
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Info label="Telefone" value={member.profile?.phone} />
          <Info label="User ID" value={member.user_id} />
          <Info label="Role" value={roleLabel(member.role)} />
          <Info label="Status" value={member.status} />
          <Info label="Criado em" value={new Date(member.created_at).toLocaleString("pt-BR")} />
          <Info label="Ultimo acesso" value={member.profile?.last_login_at ? new Date(member.profile.last_login_at).toLocaleString("pt-BR") : null} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-2 break-words text-sm text-neutral-900">{value || "-"}</p>
    </div>
  );
}
