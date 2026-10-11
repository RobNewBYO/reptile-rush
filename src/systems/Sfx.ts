import { Save } from './Save';

export type SfxName =
  | 'jump' | 'doubleJump' | 'stomp' | 'bite' | 'venom' | 'spike' | 'water' | 'scare' | 'zap' | 'slam'
  | 'tongue' | 'squeak' | 'star' | 'hurt' | 'clink' | 'telegraph' | 'dizzy' | 'bossDefeat'
  | 'complete' | 'lose' | 'ui' | 'crack' | 'switch' | 'boing' | 'bug' | 'grub' | 'upgrade';

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  /** Slide to this frequency over the note. */
  to?: number;
  /** Start delay in seconds. */
  at?: number;
}

/**
 * Tiny Web Audio synth: every sound is generated, so there are no audio files to load or license.
 * Browsers (iOS especially) only allow audio after a user gesture, so the context is created
 * lazily in `unlock()`, which main.ts wires to the first tap/key.
 */
class Engine {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private lastPlayed: Partial<Record<SfxName, number>> = {};

  get muted(): boolean {
    return Save.muted;
  }
  set muted(v: boolean) {
    Save.setMuted(v);
  }

  unlock() {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        // iOS: use the media channel so the ringer/silent switch doesn't mute the game.
        const nav = navigator as unknown as { audioSession?: { type: string } };
        if (nav.audioSession) nav.audioSession.type = 'playback';
      }
      if (this.ctx.state !== 'running') void this.ctx.resume();
    } catch {
      /* audio is optional */
    }
  }

  play(name: SfxName) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    // Don't stack the same sound dozens of times in one frame burst.
    const now = performance.now();
    if (now - (this.lastPlayed[name] ?? -1e9) < 45) return;
    this.lastPlayed[name] = now;
    try {
      this.sounds[name]();
    } catch {
      /* ignore */
    }
  }

  private tone(freq: number, dur: number, o: ToneOpts = {}) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + (o.at ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  private noise(dur: number, o: { vol?: number; at?: number; hp?: number } = {}) {
    const ctx = this.ctx!;
    if (!this.noiseBuf) {
      this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + (o.at ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol ?? 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = src;
    if (o.hp) {
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = o.hp;
      src.connect(f);
      node = f;
    }
    node.connect(g).connect(ctx.destination);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  private sounds: Record<SfxName, () => void> = {
    jump: () => this.tone(320, 0.14, { type: 'sine', to: 640, vol: 0.14 }),
    doubleJump: () => this.tone(520, 0.14, { type: 'sine', to: 1000, vol: 0.14 }),
    stomp: () => {
      this.tone(220, 0.12, { to: 70, vol: 0.16 });
      this.noise(0.05, { vol: 0.08 });
    },
    bite: () => {
      this.noise(0.08, { vol: 0.12, hp: 800 });
      this.tone(180, 0.1, { to: 90 });
    },
    venom: () => this.tone(780, 0.28, { type: 'sawtooth', to: 220, vol: 0.1 }),
    spike: () => {
      this.tone(1300, 0.09, { type: 'sawtooth', to: 420, vol: 0.13 });
      this.noise(0.05, { vol: 0.09, hp: 3000 });
    },
    water: () => {
      this.tone(700, 0.08, { type: 'triangle', to: 1100, vol: 0.12 });
      this.noise(0.1, { vol: 0.06, hp: 2500 });
    },
    scare: () => {
      this.tone(420, 0.35, { type: 'triangle', to: 300, vol: 0.14 });
      this.tone(445, 0.35, { type: 'triangle', to: 320, vol: 0.12 });
    },
    zap: () => {
      this.noise(0.18, { vol: 0.1, hp: 1500 });
      for (let i = 0; i < 4; i++) this.tone(1400 - i * 250, 0.06, { type: 'sawtooth', at: i * 0.04, vol: 0.1 });
    },
    slam: () => {
      this.tone(140, 0.28, { type: 'sine', to: 40, vol: 0.28 });
      this.noise(0.12, { vol: 0.14 });
    },
    tongue: () => this.tone(1000, 0.08, { type: 'triangle', to: 320, vol: 0.14 }),
    squeak: () => {
      this.tone(900, 0.08, { to: 1500, vol: 0.12 });
      this.tone(1500, 0.08, { to: 1000, vol: 0.1, at: 0.08 });
    },
    star: () => {
      this.tone(1175, 0.1, { type: 'sine', vol: 0.12 });
      this.tone(1568, 0.16, { type: 'sine', vol: 0.12, at: 0.08 });
    },
    hurt: () => this.tone(340, 0.28, { type: 'sawtooth', to: 90, vol: 0.14 }),
    clink: () => {
      this.tone(1500, 0.07, { type: 'triangle', vol: 0.12 });
      this.tone(2100, 0.1, { type: 'triangle', vol: 0.08, at: 0.03 });
    },
    telegraph: () => {
      for (let i = 0; i < 3; i++) this.tone(240 + i * 40, 0.1, { at: i * 0.18, vol: 0.12 });
    },
    dizzy: () => {
      this.tone(500, 0.2, { type: 'sine', to: 250, vol: 0.12 });
      this.tone(500, 0.2, { type: 'sine', to: 250, vol: 0.1, at: 0.22 });
    },
    bossDefeat: () => {
      [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, { at: i * 0.1, vol: 0.14 }));
    },
    complete: () => {
      [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', at: i * 0.14, vol: 0.16 }));
      this.tone(1047, 0.5, { type: 'triangle', at: 0.6, vol: 0.14 });
    },
    lose: () => {
      [392, 330, 262].forEach((f, i) => this.tone(f, 0.3, { type: 'triangle', at: i * 0.25, vol: 0.15 }));
    },
    ui: () => this.tone(700, 0.06, { type: 'sine', vol: 0.12 }),
    crack: () => {
      this.noise(0.04, { vol: 0.14, hp: 1200 });
      this.noise(0.04, { vol: 0.12, hp: 1800, at: 0.07 });
    },
    bug: () => this.tone(988, 0.09, { type: 'sine', to: 1480, vol: 0.12 }),
    grub: () => {
      this.tone(660, 0.1, { type: 'triangle', vol: 0.14 });
      this.tone(990, 0.14, { type: 'triangle', vol: 0.14, at: 0.08 });
    },
    upgrade: () => {
      [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, { type: 'triangle', at: i * 0.09, vol: 0.15 }));
    },
    boing: () => {
      this.tone(180, 0.32, { type: 'sine', to: 760, vol: 0.2 });
      this.tone(320, 0.22, { type: 'triangle', to: 900, vol: 0.1, at: 0.06 });
    },
    switch: () => {
      this.tone(500, 0.08, { type: 'sine', vol: 0.12 });
      this.tone(750, 0.1, { type: 'sine', vol: 0.12, at: 0.07 });
    },
  };
}

export const Sfx = new Engine();

/** Call once at startup: audio can only start from a user gesture. */
export function installAudioUnlock() {
  const unlock = () => Sfx.unlock();
  for (const ev of ['pointerdown', 'touchend', 'keydown']) {
    window.addEventListener(ev, unlock, { passive: true });
  }
}
