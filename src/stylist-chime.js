export function createStylistChime() {
  let context;

  function unlock(event) {
    if (!event?.isTrusted || window.navigator.userActivation?.isActive === false) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      if (!context || context.state === 'closed') context = new Audio();
      if (context.state === 'suspended' || context.state === 'interrupted') {
        context.resume().catch(() => {});
      }
    } catch { /* Sound is optional when audio is unavailable. */ }
  }

  function play() {
    if (context?.state !== 'running' || document.hidden) return;
    try {
      const start = context.currentTime + 0.012;
      [659.25, 880].forEach((frequency, index) => {
        const time = start + index * 0.085;
        const note = context.createOscillator();
        const volume = context.createGain();
        note.type = 'sine';
        note.frequency.value = frequency;
        volume.gain.setValueAtTime(0.0001, time);
        volume.gain.exponentialRampToValueAtTime(0.027, time + 0.014);
        volume.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
        note.connect(volume).connect(context.destination);
        note.onended = () => { note.disconnect(); volume.disconnect(); };
        note.start(time);
        note.stop(time + 0.15);
      });
    } catch { /* A changing audio context must not interrupt the reply. */ }
  }

  return { unlock, play };
}
