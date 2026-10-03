class SoundManager {
  private audioCtx: AudioContext | null = null

  private initCtx() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.audioCtx = new AudioCtx()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
  }

  /**
   * Plays a distinct alert chime using Web Audio API (no external file dependency).
   */
  public playNewOrderAlert() {
    try {
      this.initCtx()
      if (!this.audioCtx) return

      const now = this.audioCtx.currentTime
      const osc1 = this.audioCtx.createOscillator()
      const osc2 = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, now) // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15) // A5

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(440, now)
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15)

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.audioCtx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.4)
      osc2.stop(now + 0.4)

      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
    } catch (e) {
      console.warn('Audio alert failed:', e)
    }
  }
}

export const soundManager = new SoundManager()
