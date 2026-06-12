import { useEffect, useRef, useState } from "react";

// Lector de QR con la cámara (html5-qrcode). La librería se importa de forma
// dinámica dentro del efecto para que NO se ejecute en el render del servidor
// (SSR) — accede a navigator/document, que no existen en el server.

const REGION_ID = "qr-reader-region";

export function QrScanner({
  onScan,
  paused,
}: {
  onScan: (text: string) => void;
  paused: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const pausedRef = useRef(paused);
  const onScanRef = useRef(onScan);
  const lastRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const instance = new Html5Qrcode(REGION_ID, false);
        scannerRef.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => {
            if (pausedRef.current) return;
            const now = Date.now();
            // Evita disparos repetidos del mismo QR en ráfaga (varios frames).
            if (decodedText === lastRef.current.text && now - lastRef.current.at < 2500) {
              return;
            }
            lastRef.current = { text: decodedText, at: now };
            onScanRef.current(decodedText);
          },
          () => {
            /* frames sin QR: se ignoran */
          },
        );
      } catch {
        if (!cancelled) {
          setError(
            "No se pudo acceder a la cámara. Concede el permiso y abre la app por HTTPS o localhost.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      if (inst) {
        inst
          .stop()
          .then(() => inst.clear())
          .catch(() => {
            /* ya estaba detenido */
          });
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div
        id={REGION_ID}
        className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-black [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      />
      {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
