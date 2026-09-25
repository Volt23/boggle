let audioContext: AudioContext | null = null;

// Synthesised locally so the app doesn't depend on a hot-linked third-party file.
export function playTimerEndSound() {
  try {
    audioContext ??= new AudioContext();
    const ctx = audioContext;
    void ctx.resume();

    [0, 0.25, 0.5].forEach((offset) => {
      const start = ctx.currentTime + offset;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    });
  } catch (error) {
    console.warn('Could not play sound:', error);
  }
}
