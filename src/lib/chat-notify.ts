// Notificación sonora de mensaje nuevo. Genera un "ding-dong" corto con la
// Web Audio API para no depender de archivos de audio. Falla en silencio si el
// navegador bloquea el audio (p. ej. sin interacción previa del usuario).

let audioCtx: AudioContext | null = null;

function tone(ctx: AudioContext, frequency: number, start: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration);
}

export function playMessageSound() {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const now = audioCtx.currentTime;
    tone(audioCtx, 660, now, 0.18);
    tone(audioCtx, 880, now + 0.16, 0.22);
  } catch {
    /* audio no disponible / bloqueado → ignora */
  }
}
