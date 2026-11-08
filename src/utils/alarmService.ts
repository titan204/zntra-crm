/**
 * Web Audio API synthesizer for audible CRM alarms and reminders
 * Generates rich, pleasant and urgent chime sounds in the browser
 */
class AlarmAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Plays a professional high-pitch crystalline alert chime (3 notes ascending)
   */
  public playReminderChime(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      this.playTone(ctx, 659.25, now, 0.25, 'sine');
      // Note 2: G#5 (830.61 Hz)
      this.playTone(ctx, 830.61, now + 0.18, 0.25, 'sine');
      // Note 3: B5 (987.77 Hz)
      this.playTone(ctx, 987.77, now + 0.36, 0.45, 'triangle');
      // Harmonic octave: E6 (1318.51 Hz)
      this.playTone(ctx, 1318.51, now + 0.54, 0.65, 'sine');
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  }

  /**
   * Plays an urgent double alarm chime for overdue customer follow-up
   */
  public playUrgentAlarm(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      for (let i = 0; i < 2; i++) {
        const offset = i * 0.4;
        this.playTone(ctx, 880, now + offset, 0.15, 'square', 0.15);
        this.playTone(ctx, 1174.66, now + offset + 0.12, 0.25, 'triangle', 0.2);
      }
    } catch (e) {
      console.warn('Urgent alarm playback failed:', e);
    }
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    peakVolume = 0.25
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const alarmAudio = new AlarmAudioEngine();

/**
 * Returns formatted Cairo time string
 */
export function getCairoCurrentTimeFormatted(): string {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date());
}

/**
 * Returns Cairo date string
 */
export function getCairoCurrentDateFormatted(): string {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}
