import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useStore } from "@/contexts/StoreContext";

const FALLBACK_THEME = {
  displayName: "SPECIFICA",
  logoUrl: null as string | null,
  faviconUrl: "/favicon.ico",
  primary: "#111827",
  secondary: "#6B7280",
  accent: "#C9952F",
  background: "#FFFFFF",
  foreground: "#111827",
  mode: "light" as "light" | "dark",
};

interface StoreThemeValue {
  displayName: string;
  logoUrl: string | null;
  faviconUrl: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  mode: "light" | "dark";
  hasStoreBranding: boolean;
}

const StoreThemeContext = createContext<StoreThemeValue>(FALLBACK_THEME as StoreThemeValue);

function useSystemThemeMode() {
  const [systemMode, setSystemMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemMode(query.matches ? "dark" : "light");
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return systemMode;
}

function isDark(mode: string | null | undefined, systemMode: "light" | "dark") {
  if (mode === "dark") return true;
  if (mode === "system") return systemMode === "dark";
  return false;
}

export function StoreThemeProvider({ children }: { children: ReactNode }) {
  const { currentStore } = useStore();
  const systemMode = useSystemThemeMode();

  const theme = useMemo<StoreThemeValue>(() => {
    const dark = isDark(currentStore?.theme_mode, systemMode);
    const displayName = currentStore?.display_name?.trim() || currentStore?.name || FALLBACK_THEME.displayName;

    return {
      displayName,
      logoUrl: currentStore?.logo_url || null,
      faviconUrl: currentStore?.favicon_url || FALLBACK_THEME.faviconUrl,
      primary: currentStore?.primary_color || FALLBACK_THEME.primary,
      secondary: currentStore?.secondary_color || FALLBACK_THEME.secondary,
      accent: currentStore?.accent_color || FALLBACK_THEME.accent,
      background: currentStore?.background_color || (dark ? "#111827" : FALLBACK_THEME.background),
      foreground: currentStore?.text_color || (dark ? "#F9FAFB" : FALLBACK_THEME.foreground),
      mode: dark ? "dark" : "light",
      hasStoreBranding: !!currentStore,
    };
  }, [currentStore, systemMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--store-primary", theme.primary);
    root.style.setProperty("--store-secondary", theme.secondary);
    root.style.setProperty("--store-accent", theme.accent);
    root.style.setProperty("--store-background", theme.background);
    root.style.setProperty("--store-foreground", theme.foreground);
    root.style.setProperty("color-scheme", theme.mode);
    root.dataset.storeTheme = theme.mode;

    return () => {
      root.style.removeProperty("--store-primary");
      root.style.removeProperty("--store-secondary");
      root.style.removeProperty("--store-accent");
      root.style.removeProperty("--store-background");
      root.style.removeProperty("--store-foreground");
      root.style.removeProperty("color-scheme");
      delete root.dataset.storeTheme;
    };
  }, [theme]);

  return (
    <StoreThemeContext.Provider value={theme}>
      <Helmet>
        <title>{theme.hasStoreBranding ? `${theme.displayName} | SPECIFICA` : "SPECIFICA | Plataforma SaaS multi-loja"}</title>
        <link rel="icon" href={theme.faviconUrl} />
      </Helmet>
      {children}
    </StoreThemeContext.Provider>
  );
}

export function useStoreTheme() {
  return useContext(StoreThemeContext);
}
