import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useStoreTheme } from "@/contexts/StoreThemeContext";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  BarChart3,
  BriefcaseBusiness,
  FolderOpen,
  Handshake,
  Heart,
  LogOut,
  Maximize2,
  Minimize2,
  Pencil,
  Settings,
  User,
  WalletCards,
} from "lucide-react";
import logoSpecifica from "@/assets/logo-specifica.png";

const getFullscreenElement = () =>
  document.fullscreenElement || (document as any).webkitFullscreenElement || null;

const isTabletLikeDevice = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const hasTouch = navigator.maxTouchPoints > 1;
  const isiPad = /iPad/.test(ua) || (platform === "MacIntel" && hasTouch);
  const isAndroidTablet = /Android/.test(ua) && !/Mobile/.test(ua);
  const tabletViewport = window.innerWidth >= 720 && window.innerWidth <= 1366;

  return isiPad || isAndroidTablet || (hasTouch && tabletViewport);
};

const roleLabels: Record<string, string> = {
  super_admin: "super admin",
  store_admin: "store admin",
  manager: "manager",
  seller: "seller",
  architect: "architect",
  finance: "finance",
  financial: "finance",
  viewer: "viewer",
};

export default function Navbar() {
  const { user, isAdmin, isMasterAdmin, isManager, isSeller, isArchitect, isStaff, signOut } = useAuth();
  const {
    stores,
    currentStore,
    currentStoreId,
    currentRole,
    isSuperAdmin,
    isStoreAdmin,
    isManager: isStoreManager,
    isSeller: isStoreSeller,
    isArchitect: isStoreArchitect,
    loading: storeLoading,
    error: storeError,
    setCurrentStoreId,
  } = useStore();
  const storeTheme = useStoreTheme();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [useAppFullscreen, setUseAppFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!getFullscreenElement() || document.documentElement.classList.contains("app-fullscreen"));
    };

    setFullscreenSupported(
      isTabletLikeDevice() ||
      !!document.documentElement.requestFullscreen ||
      !!(document.documentElement as any).webkitRequestFullscreen
    );
    handleChange();

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange as EventListener);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange as EventListener);
      document.documentElement.classList.remove("app-fullscreen");
      document.body.classList.remove("app-fullscreen");
    };
  }, []);

  useEffect(() => {
    const syncViewportHeight = () => {
      document.documentElement.style.setProperty("--app-viewport-height", `${window.innerHeight}px`);
    };

    syncViewportHeight();
    window.addEventListener("resize", syncViewportHeight);
    window.addEventListener("orientationchange", syncViewportHeight);

    return () => {
      window.removeEventListener("resize", syncViewportHeight);
      window.removeEventListener("orientationchange", syncViewportHeight);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const setAppFullscreen = (enabled: boolean) => {
    setUseAppFullscreen(enabled);
    document.documentElement.classList.toggle("app-fullscreen", enabled);
    document.body.classList.toggle("app-fullscreen", enabled);
    setIsFullscreen(enabled || !!getFullscreenElement());
  };

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const root = document.documentElement as any;
      const active = getFullscreenElement();

      if (isTabletLikeDevice()) {
        setAppFullscreen(!useAppFullscreen);
        return;
      }

      if (useAppFullscreen) {
        setAppFullscreen(false);
      } else if (active) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      } else {
        setAppFullscreen(true);
      }
    } catch {
      setAppFullscreen(!useAppFullscreen);
    }
  };

  const navTextClass = "shrink-0 text-[10px] uppercase tracking-[0.15em] transition-colors link-underline";
  const navIconTextClass = `flex shrink-0 items-center gap-1.5 ${navTextClass}`;
  const roleLabel = isSuperAdmin ? roleLabels.super_admin : currentRole ? roleLabels[currentRole] ?? currentRole : "sem papel";
  const canManagePlatform = isMasterAdmin;
  const canManageStore = canManagePlatform || isAdmin || isSuperAdmin || isStoreAdmin || isManager || isStoreManager;
  const canUseRoutine = isSeller || isStoreSeller;
  const canUseManagement = canManageStore;
  const canUseFinance = canManageStore || currentRole === "finance" || currentRole === "financial";
  const canUseProjects = canManageStore || canUseRoutine || isStaff || isStoreArchitect;
  const canSeeRelationship = canManageStore || canUseRoutine || isArchitect || isStoreArchitect;
  const canUsePriceTools = isStaff || canManageStore || currentRole === "finance" || currentRole === "financial";
  const currentStoreName = currentStore?.display_name?.trim() || currentStore?.name || storeTheme.displayName;

  return (
    <>
      <nav
        className="app-navbar flex items-center justify-between gap-3 border-b text-white backdrop-blur-lg transition-all duration-300 [&_a]:text-white/75 [&_a:hover]:text-white [&_button]:text-white/75 [&_button:hover]:text-white"
        style={{
          backgroundColor: storeTheme.primary,
          borderColor: `${storeTheme.accent}55`,
        }}
      >
        <Link to="/catalog" className="flex min-h-12 shrink-0 items-center overflow-visible group">
          {storeTheme.logoUrl ? (
            <span className="flex h-11 max-w-44 items-center rounded-md bg-white px-3 py-1.5 shadow-sm">
              <img
                src={storeTheme.logoUrl}
                alt={storeTheme.displayName}
                className="max-h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </span>
          ) : storeTheme.hasStoreBranding ? (
            <span className="max-w-44 truncate text-sm font-semibold uppercase tracking-[0.18em] text-white">
              {storeTheme.displayName}
            </span>
          ) : (
            <img
              src={logoSpecifica}
              alt="SPECIFICA"
              className="h-12 w-auto invert transition-transform duration-300 group-hover:scale-[1.02] md:h-14"
            />
          )}
        </Link>

        <div className="app-navbar-scroll flex flex-1 items-center justify-end gap-2 text-sm sm:gap-4 lg:gap-5">
          <Link to="/catalog" className={navTextClass}>
            Cat&aacute;logo
          </Link>
          <Link to="/curadoria" className={navTextClass}>
            Curadoria
          </Link>
          {canSeeRelationship && (
            <Link
              to="/relacionamento"
              className="hidden shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] transition-colors link-underline md:flex"
              title="Relacionamento"
            >
              <Handshake size={14} />
              Relacionamento
            </Link>
          )}
          {canUseProjects && (
            <Link
              to="/projects"
              className={navIconTextClass}
              title={canManageStore ? "Todos os Projetos" : canUseRoutine ? "Painel do Vendedor" : "Meus Projetos"}
            >
              {canUseRoutine ? <Pencil size={14} /> : <FolderOpen size={14} />}
              Projetos
            </Link>
          )}

          {canUsePriceTools && (
            <Link to="/consultor-valores" className={navIconTextClass} title="Cotacao">
              <BadgeDollarSign size={14} />
              Cota&ccedil;&atilde;o
            </Link>
          )}

          {canUseManagement && (
            <Link to="/gestao" className={navIconTextClass} title="Gestao">
              <BriefcaseBusiness size={14} />
              Gest&atilde;o
            </Link>
          )}

          {canUseRoutine && (
            <Link to="/rotina" className={navIconTextClass} title="Rotina">
              <Pencil size={14} />
              Rotina
            </Link>
          )}

          {canUseFinance && (
            <Link to="/financeiro" className={navIconTextClass} title="Financeiro">
              <WalletCards size={14} />
              Financeiro
            </Link>
          )}

          <Link to="/favorites" className="shrink-0 text-muted-foreground transition-colors duration-200 hover:text-accent" title="Favoritos">
            <Heart size={18} />
          </Link>

          {canManageStore && (
            <Link to="/admin-loja" className={navIconTextClass} title="Admin da loja">
              <Settings size={14} />
              Admin
            </Link>
          )}

          {canManagePlatform && (
            <Link to="/admin" className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-accent transition-colors hover:text-accent/80">
              <BarChart3 size={14} />
              Admin Master
            </Link>
          )}

          <div className="hidden min-w-0 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/70 lg:flex">
            {storeLoading ? (
              <span>Carregando loja</span>
            ) : storeError ? (
              <span title={storeError}>Loja indisponivel</span>
            ) : currentStore ? (
              <>
                {stores.length > 1 ? (
                  <select
                    value={currentStoreId ?? ""}
                    onChange={event => setCurrentStoreId(event.target.value)}
                    className="max-w-40 bg-transparent text-white outline-none [&_option]:bg-black"
                    aria-label="Loja atual"
                  >
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.display_name?.trim() || store.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="max-w-40 truncate">{currentStoreName}</span>
                )}
                <span className="h-3 w-px bg-white/15" aria-hidden="true" />
                <span className="text-white/50">{roleLabel}</span>
              </>
            ) : (
              <span>Sem loja vinculada</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-l border-white/15 pl-3">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <User size={14} />
              <span className="hidden xl:inline">{user?.email?.split("@")[0]}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-muted-foreground transition-colors hover:text-foreground"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={16} />
            </button>
            {fullscreenSupported && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
          </div>
        </div>
      </nav>
      <div className="app-navbar-spacer" aria-hidden="true" />
    </>
  );
}
