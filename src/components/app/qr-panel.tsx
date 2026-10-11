import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, FileCode, Share2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { useAsyncAction } from "@/lib/use-async-action";
import { CARD } from "./parts";

const FILE_BASENAME = "menu-diario-qr";
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/;

/** Enlace que codifica el QR: VITE_PUBLIC_APP_URL (https) o el origen actual. */
function resolveAppUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL;
  if (typeof configured === "string" && /^https:\/\/[^\s]+$/.test(configured)) return configured;
  return typeof window !== "undefined" ? `${window.location.origin}/` : "";
}

function isLocalOnly(url: string): boolean {
  try {
    return LOCAL_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

const QR_OPTIONS = {
  margin: 2,
  width: 720,
  errorCorrectionLevel: "M",
  color: { dark: "#12110f", light: "#f4f0e6" },
} as const;

function triggerDownload(href: string, name: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function QrPanel() {
  const [url, setUrl] = useState("");
  const [png, setPng] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const downloadPng = useAsyncAction();
  const downloadSvg = useAsyncAction();
  const share = useAsyncAction();
  const copy = useAsyncAction();

  useEffect(() => {
    setUrl(resolveAppUrl());
  }, []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    Promise.all([
      QRCode.toDataURL(url, QR_OPTIONS),
      QRCode.toString(url, { ...QR_OPTIONS, type: "svg" }),
    ])
      .then(([dataUrl, markup]) => {
        if (cancelled) return;
        setPng(dataUrl);
        setSvg(markup);
        setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [url]);

  const local = url !== "" && isLocalOnly(url);
  const fileName = `${FILE_BASENAME}.png`;

  return (
    <section className="space-y-6 px-5 py-5">
      <div>
        <h2 className="font-display text-4xl text-fg">Llévala a tu teléfono</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Escanea el código con la cámara de cualquier celular o tableta. Se abre en el navegador, y
          desde ahí puedes instalarla en la pantalla de inicio.
        </p>
      </div>

      <figure className={`${CARD} flex flex-col items-center gap-3`}>
        {png ? (
          <img
            src={png}
            alt={`Código QR que abre Menú Diario en ${url}`}
            width={240}
            height={240}
            className="h-auto w-full max-w-60 rounded-xl"
          />
        ) : (
          <div
            role="status"
            aria-busy={!failed}
            className="grid aspect-square w-full max-w-60 place-items-center rounded-xl bg-raise text-sm text-muted"
          >
            {failed ? "No se pudo generar el código" : "Generando código…"}
          </div>
        )}
        <figcaption className="break-all text-center text-sm text-muted">
          {url ? (
            <a href={url} className="text-fg underline-offset-4 hover:underline">
              {url}
            </a>
          ) : null}
        </figcaption>
      </figure>

      {local ? (
        <p
          role="note"
          className="rounded-2xl border border-clay/40 bg-clay-soft p-4 text-sm text-fg"
        >
          Estás viendo la app desde una dirección local, así que el código solo abre en esta
          computadora. Para compartirla, define <code>VITE_PUBLIC_APP_URL</code> con la dirección
          pública (https).
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <ActionButton
          variant="primary"
          status={downloadPng.status}
          disabled={!png}
          onAction={() =>
            void downloadPng.run(() => {
              if (!png) throw new Error("sin QR");
              triggerDownload(png, fileName);
            })
          }
          icon={<Download size={16} aria-hidden />}
          loadingText="Preparando…"
          successText="Descargado"
          errorText="Intenta de nuevo"
        >
          PNG
        </ActionButton>
        <ActionButton
          variant="secondary"
          status={downloadSvg.status}
          disabled={!svg}
          onAction={() =>
            void downloadSvg.run(() => {
              if (!svg) throw new Error("sin QR");
              const blob = new Blob([svg], { type: "image/svg+xml" });
              const href = URL.createObjectURL(blob);
              triggerDownload(href, `${FILE_BASENAME}.svg`);
              window.setTimeout(() => URL.revokeObjectURL(href), 4000);
            })
          }
          icon={<FileCode size={16} aria-hidden />}
          loadingText="Preparando…"
          successText="Descargado"
          errorText="Intenta de nuevo"
        >
          SVG
        </ActionButton>
        <ActionButton
          variant="secondary"
          status={share.status}
          disabled={!url}
          onAction={() =>
            void share.run(async () => {
              if (typeof navigator.share === "function") {
                await navigator.share({
                  title: "Menú Diario",
                  text: "Planea tus comidas con tu presupuesto.",
                  url,
                });
                return;
              }
              await navigator.clipboard.writeText(url);
            })
          }
          icon={<Share2 size={16} aria-hidden />}
          loadingText="Compartiendo…"
          successText="Listo"
          errorText="Cancelado"
        >
          Compartir
        </ActionButton>
        <ActionButton
          variant="secondary"
          status={copy.status}
          disabled={!url}
          onAction={() => void copy.run(() => navigator.clipboard.writeText(url))}
          icon={<Copy size={16} aria-hidden />}
          loadingText="Copiando…"
          successText="Enlace copiado"
          errorText="No se pudo copiar"
        >
          Copiar enlace
        </ActionButton>
      </div>
    </section>
  );
}
