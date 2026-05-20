class SoundManager {
  private context: AudioContext | null = null;

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    this.init();
    if (!this.context) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);

    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  playInput() {
    this.playTone(440, 'sine', 0.1, 0.05); // A4
  }

  playError() {
    this.playTone(150, 'sawtooth', 0.2, 0.05);
  }

  playSuccess() {
    this.playTone(880, 'sine', 0.1, 0.05); // A5
    setTimeout(() => this.playTone(1108.73, 'sine', 0.2, 0.05), 100); // C#6
  }

  playComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.5, 0.05), i * 150);
    });
  }
}

export const soundManager = new SoundManager();
