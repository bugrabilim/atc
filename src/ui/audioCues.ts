export type AudioCue = 'select' | 'command' | 'readback' | 'handoff' | 'landing' | 'warning' | 'alert';

type AudioContextConstructor = new () => AudioContext;

const CUE_NOTES: Record<AudioCue, { notes: number[]; duration: number; volume: number; wave: OscillatorType }> = {
  select: { notes: [660], duration: 0.05, volume: 0.035, wave: 'sine' },
  command: { notes: [520, 740], duration: 0.11, volume: 0.045, wave: 'square' },
  readback: { notes: [430, 560], duration: 0.15, volume: 0.04, wave: 'sine' },
  handoff: { notes: [620, 780], duration: 0.18, volume: 0.05, wave: 'sine' },
  landing: { notes: [520, 660, 880], duration: 0.26, volume: 0.055, wave: 'sine' },
  warning: { notes: [830, 660], duration: 0.28, volume: 0.065, wave: 'square' },
  alert: { notes: [920, 700, 920], duration: 0.42, volume: 0.09, wave: 'sawtooth' },
};

/** Small synthesized cues avoid network-loaded audio files and work offline in the PWA. */
export class AudioCuePlayer {
  private context: AudioContext | null = null;

  async unlock() {
    if (typeof window === 'undefined') return;
    const browserWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
    const AudioContextClass = window.AudioContext ?? browserWindow.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context ??= new AudioContextClass();
    if (this.context.state === 'suspended') await this.context.resume();
  }

  play(cue: AudioCue) {
    const context = this.context;
    if (!context || context.state !== 'running') return;
    const recipe = CUE_NOTES[cue];
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const noteDuration = recipe.duration / recipe.notes.length;

    oscillator.type = recipe.wave;
    recipe.notes.forEach((frequency, index) => oscillator.frequency.setValueAtTime(frequency, start + index * noteDuration));
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(recipe.volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + recipe.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + recipe.duration + 0.02);
  }
}
