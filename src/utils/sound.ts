export function playTimerEndSound() {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  audio.play().catch(error => {
    console.warn('Could not play sound:', error);
  });
}