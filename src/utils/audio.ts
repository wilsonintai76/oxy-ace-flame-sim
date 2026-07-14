/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class FlameAudio {
  private audioCtx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private brownNoiseNode: AudioBufferSourceNode | null = null;
  private humNode: OscillatorNode | null = null;
  private flutterLFO: OscillatorNode | null = null;
  private flutterGain: GainNode | null = null;
  private humGainNode: GainNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private filterNode2: BiquadFilterNode | null = null;
  private isLit: boolean = false;
  private isMuted: boolean = false;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  private createNodes() {
    if (!this.audioCtx) return;
    this.init();

    const bufferSize = this.audioCtx.sampleRate * 2;
    
    // 1. White Noise (High-frequency hiss)
    const whiteBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const whiteData = whiteBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) whiteData[i] = Math.random() * 2 - 1;

    this.noiseNode = this.audioCtx.createBufferSource();
    this.noiseNode.buffer = whiteBuffer;
    this.noiseNode.loop = true;

    // 2. Brown Noise (Deep combustion roar)
    const brownBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const brownData = brownBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      brownData[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = brownData[i];
      brownData[i] *= 3.5; // Gain adjustment
    }

    this.brownNoiseNode = this.audioCtx.createBufferSource();
    this.brownNoiseNode.buffer = brownBuffer;
    this.brownNoiseNode.loop = true;

    // 3. Resonant Hum
    this.humNode = this.audioCtx.createOscillator();
    this.humNode.type = "sawtooth";
    this.humNode.frequency.setValueAtTime(55, this.audioCtx.currentTime);

    this.humGainNode = this.audioCtx.createGain();
    this.humGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);

    const humFilter = this.audioCtx.createBiquadFilter();
    humFilter.type = "lowpass";
    humFilter.frequency.setValueAtTime(120, this.audioCtx.currentTime);

    this.humNode.connect(humFilter);
    humFilter.connect(this.humGainNode);

    // 4. Flutter LFO for Carburizing flame
    this.flutterLFO = this.audioCtx.createOscillator();
    this.flutterLFO.type = "sine";
    this.flutterLFO.frequency.setValueAtTime(8, this.audioCtx.currentTime); // 8Hz flutter
    
    this.flutterGain = this.audioCtx.createGain();
    this.flutterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

    this.flutterLFO.connect(this.flutterGain);

    // 5. Main Processing Chain
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);

    this.filterNode = this.audioCtx.createBiquadFilter();
    this.filterNode.type = "bandpass";
    this.filterNode.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
    this.filterNode.Q.setValueAtTime(2.0, this.audioCtx.currentTime);

    this.filterNode2 = this.audioCtx.createBiquadFilter();
    this.filterNode2.type = "lowpass";
    this.filterNode2.frequency.setValueAtTime(400, this.audioCtx.currentTime);

    // Connect noise sources
    this.noiseNode.connect(this.filterNode);
    this.brownNoiseNode.connect(this.filterNode2);
    
    this.filterNode.connect(this.gainNode);
    this.filterNode2.connect(this.gainNode);

    // Modulation
    this.flutterGain.connect(this.gainNode.gain);

    // Destination
    this.gainNode.connect(this.audioCtx.destination);
    this.humGainNode.connect(this.audioCtx.destination);

    this.noiseNode.start();
    this.brownNoiseNode.start();
    this.humNode.start();
    this.flutterLFO.start();
  }

  public setLit(lit: boolean) {
    this.isLit = lit;
    this.updateAudioState();
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    this.updateAudioState();
  }

  public updateFlame(c2h2: number, o2: number, ratio: number) {
    if (!this.gainNode || !this.filterNode || !this.filterNode2 || !this.humGainNode || !this.flutterGain || !this.audioCtx) return;

    if (this.isMuted) {
      this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
      this.humGainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
      return;
    }

    const totalFlow = c2h2 + o2;
    
    if (!this.isLit) {
      // Silence gas flow/hiss when flame is extinguished
      this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.08);
      this.humGainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.08);
      return;
    }

    // --- Flame Lit Dynamics ---
    const intensity = totalFlow / 20;
    const targetGain = 0.12 + intensity * 0.45;
    this.gainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.1);
    this.humGainNode.gain.setTargetAtTime(targetGain * 0.35, this.audioCtx.currentTime, 0.1);

    // Chemistry-dependent frequency and modulation
    if (ratio < 0.45) {
      // Carburizing: Heavy roar, soft hiss, significant fluttering
      this.filterNode.frequency.setTargetAtTime(450 + ratio * 400, this.audioCtx.currentTime, 0.15);
      this.filterNode.Q.setTargetAtTime(1.2, this.audioCtx.currentTime, 0.15);
      this.filterNode2.frequency.setTargetAtTime(400, this.audioCtx.currentTime, 0.1);
      
      // Add "flutter" depth
      const flutterDepth = 0.04 * (1 - ratio * 2);
      this.flutterGain.gain.setTargetAtTime(flutterDepth, this.audioCtx.currentTime, 0.2);
    } else if (ratio < 0.55) {
      // Neutral: Balanced roar and crisp hiss
      this.filterNode.frequency.setTargetAtTime(1200, this.audioCtx.currentTime, 0.1);
      this.filterNode.Q.setTargetAtTime(2.8, this.audioCtx.currentTime, 0.1);
      this.filterNode2.frequency.setTargetAtTime(600, this.audioCtx.currentTime, 0.1);
      this.flutterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
    } else {
      // Oxidizing: Piercing high-frequency whistle, reduced roar
      const screamPitch = 2200 + (ratio - 0.55) * 3500;
      this.filterNode.frequency.setTargetAtTime(screamPitch, this.audioCtx.currentTime, 0.05);
      this.filterNode.Q.setTargetAtTime(6.5, this.audioCtx.currentTime, 0.05);
      this.filterNode2.frequency.setTargetAtTime(300, this.audioCtx.currentTime, 0.1); // Reduced roar
      this.flutterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
    }
  }

  private updateAudioState() {
    if (!this.audioCtx) {
      this.init();
      this.createNodes();
    }
  }

  public playPop(freq: number = 180, volume: number = 0.8) {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.16);
  }

  // UI SOUNDS

  public playClick(isMuted: boolean) {
    if (isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  public playWhoosh(isMuted: boolean) {
    if (isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const bufferSize = this.audioCtx.sampleRate * 0.1;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.1);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start();
  }

  public playSpark(isMuted: boolean) {
    if (isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.04);
  }

  public playExtinguish(isMuted: boolean) {
    if (isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.25);
  }
}

export const flameAudio = new FlameAudio();
export const soundManager = flameAudio; // Alias for backward compatibility if I used it elsewhere
