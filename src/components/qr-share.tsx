import { useRef, useState } from "react";
import { ArrowDownToLine, Check, Copy, ExternalLink, QrCode, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type Props = { url: string };

function saveFile(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

function svgFile(svg: SVGSVGElement): Blob {
  const markup = new XMLSerializer().serializeToString(svg);
  return new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
}

async function pngFile(svg: SVGSVGElement): Promise<Blob> {
  const svgUrl = URL.createObjectURL(svgFile(svg));
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = svgUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la imagen.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) return blob;

    const dataUrl = canvas.toDataURL("image/png");
    const encoded = dataUrl.split(",")[1];
    if (!encoded) throw new Error("No se pudo exportar el PNG.");
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    return new Blob([bytes], { type: "image/png" });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function QRShare({ url }: Props) {
  const qrRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setMessage("Enlace copiado. Ya puedes compartirlo.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage("No se pudo copiar automáticamente. Mantén pulsado el enlace para copiarlo.");
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Menú Diario",
          text: "Planeemos comidas ricas y económicas.",
          url,
        });
        setMessage("Enlace compartido.");
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  function downloadSvg() {
    const svg = qrRef.current;
    if (!svg) return;
    saveFile(svgFile(svg), "menu-diario-qr.svg");
    setMessage("QR en SVG descargado.");
  }

  async function downloadPng() {
    const svg = qrRef.current;
    if (!svg) return;
    setBusy(true);
    setMessage("");
    try {
      saveFile(await pngFile(svg), "menu-diario-qr.png");
      setMessage("QR en PNG descargado, listo para guardar o imprimir.");
    } catch {
      setMessage(
        "No se pudo crear el PNG. Prueba la descarga en SVG, compatible con impresión y pantallas.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="qr-page" aria-labelledby="qr-title">
      <div className="qr-intro">
        <span className="eyebrow-pill">
          <QrCode size={15} /> Comparte sin complicaciones
        </span>
        <h1 id="qr-title" className="font-display text-4xl leading-tight text-fg sm:text-5xl">
          Una buena idea <span className="text-clay">se comparte.</span>
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted">
          Escanea el código para abrir Menú Diario en cualquier teléfono, tableta o computadora. El
          QR solo contiene el enlace de la app; nunca incluye tu lista ni tu presupuesto.
        </p>
      </div>

      <div className="qr-layout">
        <div className="qr-paper">
          <div className="qr-sticker" aria-label="Código QR de Menú Diario">
            {url ? (
              <QRCodeSVG
                ref={qrRef}
                value={url}
                size={288}
                level="H"
                marginSize={4}
                bgColor="#ffffff"
                fgColor="#26382f"
                title="Código QR para abrir Menú Diario"
              />
            ) : (
              <div className="qr-loading" aria-label="Preparando código QR" />
            )}
          </div>
          <div className="qr-sticker-caption">
            <span>MENÚ DIARIO</span>
            <span>Escanéame ↗</span>
          </div>
        </div>

        <div className="qr-actions-card">
          <p className="eyebrow">Tu enlace para compartir</p>
          <h2 className="mt-1 font-display text-2xl text-fg">Llévalo a todas partes</h2>
          <a className="share-url" href={url || undefined} target="_blank" rel="noreferrer">
            <span>{url || "Preparando enlace…"}</span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
          <div className="qr-button-stack">
            <button
              type="button"
              className="button-primary"
              onClick={() => void shareLink()}
              disabled={!url}
            >
              <Share2 size={17} aria-hidden="true" /> Compartir enlace
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => void copyLink()}
              disabled={!url}
            >
              {copied ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                <Copy size={17} aria-hidden="true" />
              )}
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
          </div>
          <div className="qr-downloads">
            <p className="eyebrow">Descargar el código</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="download-tile"
                onClick={() => void downloadPng()}
                disabled={!url || busy}
              >
                <ArrowDownToLine size={17} aria-hidden="true" />
                <span>
                  <strong>{busy ? "Preparando…" : "PNG"}</strong>
                  <small>Imagen para compartir</small>
                </span>
              </button>
              <button type="button" className="download-tile" onClick={downloadSvg} disabled={!url}>
                <ArrowDownToLine size={17} aria-hidden="true" />
                <span>
                  <strong>SVG</strong>
                  <small>Nítido a cualquier tamaño</small>
                </span>
              </button>
            </div>
          </div>
          <p className="qr-message" aria-live="polite">
            {message || "El QR se genera en tu dispositivo: no se envía a un generador externo."}
          </p>
        </div>
      </div>
    </section>
  );
}
