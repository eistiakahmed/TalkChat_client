/**
 * Web Audio API synthesizer for VoIP ringback and ringtone audio.
 * Zero external asset dependencies - 100% reliable in all browser environments.
 */

let audioCtx: AudioContext | null = null;
let ringbackInterval: any = null;
let ringtoneInterval: any = null;
let activeNodes: (OscillatorNode | GainNode)[] = [];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const callAudio = {
  /**
   * Plays outgoing ringback tone (caller hears while recipient's phone is ringing).
   * Generates standard 440Hz + 480Hz dual-frequency tone pulsed: 1.5s on, 2s off.
   */
  playRingback: () => {
    callAudio.stopAll();
    try {
      const ctx = getAudioContext();

      const playPulse = () => {
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 1.5);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.55);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.6);
        osc2.stop(now + 1.6);

        activeNodes.push(osc1, osc2, gain);
      };

      playPulse();
      ringbackInterval = setInterval(playPulse, 3500);
    } catch (e) {
      console.warn('[CallAudio] Unable to play ringback:', e);
    }
  },

  /**
   * Plays incoming call melodious ringtone (recipient hears when someone calls).
   * Generates a pleasant Messenger-style chord sequence repeating every 2.5s.
   */
  playRingtone: () => {
    callAudio.stopAll();
    try {
      const ctx = getAudioContext();

      const notes = [
        { freq: 523.25, time: 0, dur: 0.15 },    // C5
        { freq: 659.25, time: 0.18, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.36, dur: 0.22 }, // G5
        { freq: 1046.5, time: 0.62, dur: 0.4 },  // C6
        { freq: 783.99, time: 1.1, dur: 0.18 },  // G5
        { freq: 1046.5, time: 1.32, dur: 0.45 }, // C6
      ];

      const playMelody = () => {
        if (!ctx) return;
        const now = ctx.currentTime;

        notes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + time);

          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.linearRampToValueAtTime(0.18, now + time + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur + 0.05);

          activeNodes.push(osc, gain);
        });
      };

      playMelody();
      ringtoneInterval = setInterval(playMelody, 2600);
    } catch (e) {
      console.warn('[CallAudio] Unable to play ringtone:', e);
    }
  },

  /**
   * Immediately stops all active oscillators, intervals, and tones.
   */
  stopAll: () => {
    if (ringbackInterval) {
      clearInterval(ringbackInterval);
      ringbackInterval = null;
    }
    if (ringtoneInterval) {
      clearInterval(ringtoneInterval);
      ringtoneInterval = null;
    }
    activeNodes.forEach((node) => {
      try {
        if ('stop' in node) (node as OscillatorNode).stop();
        node.disconnect();
      } catch {}
    });
    activeNodes = [];
  },
};
