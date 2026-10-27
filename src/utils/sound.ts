let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (!context) {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

/** Browsers only allow audio after a user gesture: call this from click handlers. */
export function unlockAudio() {
  const ctx = getContext();
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
}

/** A short three-note chime, synthesised so it works offline. */
export function playTimerEndSound() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const start = ctx.currentTime + 0.05;
  [880, 698.46, 523.25].forEach((frequency, i) => {
    const t = start + i * 0.22;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.65);
  });
}
