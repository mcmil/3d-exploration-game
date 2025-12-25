import { Scene, Sound } from '@babylonjs/core';

export type SoundEffect =
  | 'interaction_enter'
  | 'interaction_leave'
  | 'interaction_success'
  | 'quest_complete'
  | 'sleigh_bells'
  | 'ho_ho_ho';

export class AudioManager {
  private scene: Scene;
  private sounds: Map<SoundEffect, Sound> = new Map();
  private sfxVolume: number = 0.5;
  private muted: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeSounds();
  }

  /**
   * Initialize all sound effects
   * Uses procedurally generated sounds via oscillators
   */
  private initializeSounds(): void {
    // Create simple bell chime for entering interaction range
    this.createBellChime('interaction_enter', [523.25, 659.25, 783.99], 0.3); // C5, E5, G5 (C major chord)

    // Create soft whoosh for leaving interaction range
    this.createWhoosh('interaction_leave');

    // Create success jingle for successful interaction
    this.createSuccessJingle('interaction_success');

    // Create festive completion sound
    this.createQuestComplete('quest_complete');

    // Create sleigh bells sound
    this.createSleighBells('sleigh_bells');

    // Create ho-ho-ho laugh (represented by descending notes)
    this.createHoHoHo('ho_ho_ho');

    console.log('🎵 Audio system initialized with', this.sounds.size, 'sounds');
  }

  /**
   * Create a bell chime sound
   */
  private createBellChime(name: SoundEffect, frequencies: number[], duration: number): void {
    const audioContext = new AudioContext();
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Add each frequency component
      for (const freq of frequencies) {
        sample += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3); // Decay
      }

      data[i] = sample / frequencies.length * 0.3; // Normalize
    }

    const sound = new Sound(name, buffer, this.scene, null, {
      autoplay: false,
      loop: false,
      volume: this.sfxVolume
    });

    this.sounds.set(name, sound);
  }

  /**
   * Create a whoosh sound (white noise with filter)
   */
  private createWhoosh(name: SoundEffect): void {
    const audioContext = new AudioContext();
    const sampleRate = audioContext.sampleRate;
    const duration = 0.15;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // White noise with exponential decay
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.15;
    }

    const sound = new Sound(name, buffer, this.scene, null, {
      autoplay: false,
      loop: false,
      volume: this.sfxVolume * 0.4
    });

    this.sounds.set(name, sound);
  }

  /**
   * Create a success jingle (ascending arpeggio)
   */
  private createSuccessJingle(name: SoundEffect): void {
    const audioContext = new AudioContext();
    const sampleRate = audioContext.sampleRate;
    const duration = 0.6;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Ascending notes: C5, E5, G5, C6
    const notes = [
      { freq: 523.25, start: 0.0, duration: 0.15 },
      { freq: 659.25, start: 0.15, duration: 0.15 },
      { freq: 783.99, start: 0.3, duration: 0.15 },
      { freq: 1046.50, start: 0.45, duration: 0.15 }
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const note of notes) {
        if (t >= note.start && t < note.start + note.duration) {
          const noteTime = t - note.start;
          sample += Math.sin(2 * Math.PI * note.freq * noteTime) * Math.exp(-noteTime * 5);
        }
      }

      data[i] = sample * 0.3;
    }

    const sound = new Sound(name, buffer, this.scene, null, {
      autoplay: false,
      loop: false,
      volume: this.sfxVolume
    });

    this.sounds.set(name, sound);
  }

  /**
   * Create quest completion fanfare
   */
  private createQuestComplete(name: SoundEffect): void {
    const audioContext = new AudioContext();
    const sampleRate = audioContext.sampleRate;
    const duration = 1.0;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Festive fanfare: C5, E5, G5, C6, E6
    const notes = [
      { freq: 523.25, start: 0.0, duration: 0.2 },
      { freq: 659.25, start: 0.2, duration: 0.2 },
      { freq: 783.99, start: 0.4, duration: 0.2 },
      { freq: 1046.50, start: 0.6, duration: 0.3 },
      { freq: 1318.51, start: 0.7, duration: 0.3 }
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const note of notes) {
        if (t >= note.start && t < note.start + note.duration) {
          const noteTime = t - note.start;
          // Add slight chorus effect
          sample += Math.sin(2 * Math.PI * note.freq * noteTime) * Math.exp(-noteTime * 3);
          sample += Math.sin(2 * Math.PI * note.freq * 1.01 * noteTime) * Math.exp(-noteTime * 3) * 0.5;
        }
      }

      data[i] = sample * 0.25;
    }

    const sound = new Sound(name, buffer, this.scene, null, {
      autoplay: false,
      loop: false,
      volume: this.sfxVolume
    });

    this.sounds.set(name, sound);
  }

  /**
   * Create sleigh bells sound
   */
  private createSleighBells(name: SoundEffect): void {
    const audioContext = new AudioContext();
    const sampleRate = audioContext.sampleRate;
    const duration = 1.2;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Multiple high-pitched bells ringing
    const bellTimes = [0.0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
    const bellFreqs = [1760, 1975, 2093, 2349]; // A6, B6, C7, D7

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const bellTime of bellTimes) {
        if (t >= bellTime && t < bellTime + 0.3) {
          const noteTime = t - bellTime;
          for (const freq of bellFreqs) {
            sample += Math.sin(2 * Math.PI * freq * noteTime) * Math.exp(-noteTime * 8) * 0.15;
          }
        }
      }

      data[i] = sample;
    }

    const sound = new Sound(name, buffer, this.scene, null, {
      autoplay: false,
      loop: false,
      volume: this.sfxVolume * 0.7
    });

    this.sounds.set(name, sound);
  }

  /**
   * Create ho-ho-ho laugh sound
   */
  private createHoHoHo(name: SoundEffect): void {
    const audioContext = new AudioContext();
    const sampleRate = audioContext.sampleRate;
    const duration = 0.9;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Three "ho" sounds - descending bass notes
    const hos = [
      { freq: 220, start: 0.0, duration: 0.25 },  // A3
      { freq: 196, start: 0.3, duration: 0.25 },  // G3
      { freq: 174.61, start: 0.6, duration: 0.25 } // F3
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const ho of hos) {
        if (t >= ho.start && t < ho.start + ho.duration) {
          const noteTime = t - ho.start;
          // Deep bass tone with harmonics
          sample += Math.sin(2 * Math.PI * ho.freq * noteTime) * Math.exp(-noteTime * 4);
          sample += Math.sin(2 * Math.PI * ho.freq * 2 * noteTime) * Math.exp(-noteTime * 6) * 0.3;
        }
      }

      data[i] = sample * 0.35;
    }

    const sound = new Sound(name, buffer, this.scene, null, {
      autoplay: false,
      loop: false,
      volume: this.sfxVolume
    });

    this.sounds.set(name, sound);
  }

  /**
   * Play a sound effect
   */
  public play(effect: SoundEffect): void {
    if (this.muted) return;

    const sound = this.sounds.get(effect);
    if (sound) {
      // Stop if already playing to allow retriggering
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    } else {
      console.warn(`⚠️ Sound effect '${effect}' not found`);
    }
  }

  /**
   * Set master volume for sound effects
   */
  public setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.setVolume(this.sfxVolume);
    });
  }

  /**
   * Mute/unmute all sounds
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;
    console.log(`🔇 Audio ${muted ? 'muted' : 'unmuted'}`);
  }

  /**
   * Toggle mute
   */
  public toggleMute(): void {
    this.setMuted(!this.muted);
  }

  /**
   * Clean up all sounds
   */
  public dispose(): void {
    this.sounds.forEach(sound => sound.dispose());
    this.sounds.clear();
    console.log('🔇 Audio system disposed');
  }
}
