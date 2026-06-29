import { Card, CardContent } from "@/components/ui/card";
import { StoreUsersManager } from "@/components/master-admin/StoreUsersManager";
import { useStore } from "@/contexts/StoreContext";

const NO_ACTIVE_STORE_MESSAGE = "Nenhuma loja ativa selecionada. Selecione uma loja para continuar.";

export default function StoreAdminUsersPage() {
  const { currentStoreId } = useStore();

  if (!currentStoreId) {
    return (
      <Card className="rounded-lg">
        <CardContent className="p-8 text-center text-sm text-neutral-500">{NO_ACTIVE_STORE_MESSAGE}</CardContent>
      </Card>
    );
  }

  return <StoreUsersManager storeId={currentStoreId} scope="store" />;
}
