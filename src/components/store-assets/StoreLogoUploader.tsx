import { useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "store-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName === "jpg" ? "jpeg" : fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/svg+xml") return "svg";
  return "jpeg";
}

function safeAssetPath(storeId: string, file: File) {
  const ext = extensionFor(file);
  const stamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "")
    .replaceAll("T", "")
    .replaceAll("Z", "")
    .slice(0, 14);
  return `stores/${storeId}/logo/${stamp}-${crypto.randomUUID()}.${ext}`;
}

export function StoreLogoUploader({
  storeId,
  logoUrl,
  onChange,
}: {
  storeId: string;
  logoUrl: string | null | undefined;
  onChange: (logoUrl: string) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (!ALLOWED_TYPES.has(file.type)) {
      toast({ title: "Arquivo invalido", description: "Envie PNG, JPG, WEBP ou SVG.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Logo muito pesada", description: "O arquivo deve ter ate 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const path = safeAssetPath(storeId, file);
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await onChange(data.publicUrl);
      toast({ title: "Logo enviada", description: "A identidade visual da loja foi atualizada." });
    } catch (error: any) {
      toast({ title: "Erro ao enviar logo", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setUploading(true);
    try {
      await onChange("");
      toast({ title: "Logo removida" });
    } catch (error: any) {
      toast({ title: "Erro ao remover logo", description: error?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-14 w-20 items-center justify-center rounded-md border border-neutral-200 bg-white p-2">
            {logoUrl ? <img src={logoUrl} alt="Logo da loja" className="max-h-10 max-w-full object-contain" /> : <ImageUp size={18} className="text-neutral-400" />}
          </span>
          <div>
            <p className="text-sm font-medium text-neutral-900">Logo da loja</p>
            <p className="mt-1 text-xs text-neutral-500">PNG, JPG, WEBP ou SVG ate 5MB.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          {logoUrl && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              <Trash2 size={15} />
              Remover
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <ImageUp size={15} />
            {uploading ? "Enviando..." : "Enviar logo"}
          </button>
        </div>
      </div>
    </div>
  );
}
