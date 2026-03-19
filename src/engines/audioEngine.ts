import { useCallback, useEffect, useRef } from 'react';

interface AudioControls {
  enabled: boolean;
  muted: boolean;
  paused: boolean;
  hearingLevel: number;
  synesthesiaLevel: number;
  intrusiveThoughtsEnabled: boolean;
  distortionVolume: number;
  intrusiveThoughtsVolume: number;
}

interface AudioNodes {
  context: AudioContext;
  masterGain: GainNode;
  buzzOsc: OscillatorNode;
  buzzGain: GainNode;
  fluorescentOsc: OscillatorNode;
  fluorescentGain: GainNode;
  toneOsc: OscillatorNode;
  toneGain: GainNode;
  noiseFilter: BiquadFilterNode;
  noiseSource: AudioBufferSourceNode;
  noiseGain: GainNode;
  crackleFilter: BiquadFilterNode;
  crackleGain: GainNode;
}

const INTRUSIVE_THOUGHTS = [
  'you are so stupid',
  'you will never be free',
  "why can't you just point",
];

const BOYISH_VOICE_HINTS = [
  'alex',
  'daniel',
  'tom',
  'aaron',
  'james',
  'lee',
  'matthew',
  'oliver',
  'fred',
  'male',
];

function pickIntrusiveVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const preferredPool = englishVoices.length ? englishVoices : voices;

  return (
    preferredPool.find((voice) =>
      BOYISH_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint)),
    ) ??
    preferredPool.find((voice) => voice.localService) ??
    preferredPool[0]
  );
}

function nextIntrusiveDelay(hearingLevel: number): number {
  const base = Math.max(6500, 14000 - hearingLevel * 55);
  return Math.round(base + Math.random() * 3200);
}

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function setupAudioGraph(): AudioNodes {
  const context = new window.AudioContext();

  const masterGain = context.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(context.destination);

  const buzzOsc = context.createOscillator();
  buzzOsc.type = 'sawtooth';
  buzzOsc.frequency.value = 84;
  const buzzGain = context.createGain();
  buzzGain.gain.value = 0;
  buzzOsc.connect(buzzGain).connect(masterGain);

  const fluorescentOsc = context.createOscillator();
  fluorescentOsc.type = 'square';
  fluorescentOsc.frequency.value = 118;
  const fluorescentGain = context.createGain();
  fluorescentGain.gain.value = 0;
  fluorescentOsc.connect(fluorescentGain).connect(masterGain);

  const toneOsc = context.createOscillator();
  toneOsc.type = 'sine';
  toneOsc.frequency.value = 212;
  const toneGain = context.createGain();
  toneGain.gain.value = 0;
  toneOsc.connect(toneGain).connect(masterGain);

  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 480;

  const noiseGain = context.createGain();
  noiseGain.gain.value = 0;

  const crackleFilter = context.createBiquadFilter();
  crackleFilter.type = 'highpass';
  crackleFilter.frequency.value = 2300;

  const crackleGain = context.createGain();
  crackleGain.gain.value = 0;

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(context);
  noiseSource.loop = true;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(masterGain);
  noiseSource.connect(crackleFilter).connect(crackleGain).connect(masterGain);

  buzzOsc.start();
  fluorescentOsc.start();
  toneOsc.start();
  noiseSource.start();

  return {
    context,
    masterGain,
    buzzOsc,
    buzzGain,
    fluorescentOsc,
    fluorescentGain,
    toneOsc,
    toneGain,
    noiseFilter,
    noiseSource,
    noiseGain,
    crackleFilter,
    crackleGain,
  };
}

export function useAudioEngine({
  enabled,
  muted,
  paused,
  hearingLevel,
  synesthesiaLevel,
  intrusiveThoughtsEnabled,
  distortionVolume,
  intrusiveThoughtsVolume,
}: AudioControls): { triggerCrossSensoryTone: () => void } {
  const nodesRef = useRef<AudioNodes | null>(null);
  const modulationRef = useRef<number | null>(null);
  const intrusiveTimerRef = useRef<number | null>(null);
  const distortionMix = Math.max(0, Math.min(1, distortionVolume / 100));
  const intrusiveMix = Math.max(0, Math.min(1, intrusiveThoughtsVolume / 100));

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || nodesRef.current) return;

    nodesRef.current = setupAudioGraph();

    return () => {
      const nodes = nodesRef.current;
      if (!nodes) return;
      nodes.buzzOsc.stop();
      nodes.fluorescentOsc.stop();
      nodes.toneOsc.stop();
      nodes.noiseSource.stop();
      void nodes.context.close();
      if (modulationRef.current) {
        window.clearInterval(modulationRef.current);
        modulationRef.current = null;
      }
      if (intrusiveTimerRef.current) {
        window.clearTimeout(intrusiveTimerRef.current);
        intrusiveTimerRef.current = null;
      }
      nodesRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;

    if (nodes.context.state === 'suspended' && enabled) {
      void nodes.context.resume();
    }

    const active = enabled && !muted && !paused;
    const hearingMix = hearingLevel / 100;
    const mixedHearing = hearingMix * distortionMix;

    nodes.masterGain.gain.setTargetAtTime(active ? 0.95 : 0, nodes.context.currentTime, 0.06);
    nodes.buzzGain.gain.setTargetAtTime(active ? mixedHearing * 0.09 : 0, nodes.context.currentTime, 0.08);
    nodes.fluorescentGain.gain.setTargetAtTime(active ? mixedHearing * 0.024 : 0, nodes.context.currentTime, 0.05);
    nodes.toneGain.gain.setTargetAtTime(active ? mixedHearing * 0.075 : 0, nodes.context.currentTime, 0.08);
    nodes.noiseGain.gain.setTargetAtTime(active ? mixedHearing * 0.11 : 0, nodes.context.currentTime, 0.08);
    nodes.crackleGain.gain.setTargetAtTime(active ? mixedHearing * 0.01 : 0, nodes.context.currentTime, 0.04);

    nodes.fluorescentOsc.frequency.setTargetAtTime(112 + hearingLevel * 0.22, nodes.context.currentTime, 0.08);
    nodes.toneOsc.frequency.setTargetAtTime(150 + hearingLevel * 2.8, nodes.context.currentTime, 0.1);
    nodes.noiseFilter.frequency.setTargetAtTime(160 + hearingLevel * 6.4, nodes.context.currentTime, 0.1);
    nodes.crackleFilter.frequency.setTargetAtTime(1800 + hearingLevel * 16, nodes.context.currentTime, 0.08);

    if (!active || hearingLevel < 8 || distortionMix <= 0) {
      if (modulationRef.current) {
        window.clearInterval(modulationRef.current);
        modulationRef.current = null;
      }
      return;
    }

    if (!modulationRef.current) {
      modulationRef.current = window.setInterval(() => {
        const currentNodes = nodesRef.current;
        if (!currentNodes) return;
        const currentTime = currentNodes.context.currentTime;
        const jitter = hearingLevel * 0.9 + Math.random() * hearingLevel * 0.7;

        currentNodes.toneOsc.frequency.setTargetAtTime(130 + jitter * 3.4, currentTime, 0.07);
        currentNodes.buzzOsc.frequency.setTargetAtTime(68 + jitter * 1.8, currentTime, 0.07);
        currentNodes.fluorescentOsc.frequency.setTargetAtTime(105 + jitter * 0.45, currentTime, 0.06);
        currentNodes.noiseGain.gain.setTargetAtTime(
          Math.max(0.01 * distortionMix, hearingLevel / 700 + Math.random() * (hearingLevel / 800)) * distortionMix,
          currentTime,
          0.09,
        );
        currentNodes.fluorescentGain.gain.setTargetAtTime(
          Math.max(0.004 * distortionMix, hearingLevel / 2400 + (Math.random() > 0.62 ? hearingLevel / 880 : 0)) *
            distortionMix,
          currentTime,
          0.04,
        );
        currentNodes.crackleGain.gain.setTargetAtTime(
          Math.max(0.002 * distortionMix, hearingLevel / 3200 + (Math.random() > 0.72 ? hearingLevel / 1050 : 0)) *
            distortionMix,
          currentTime,
          0.03,
        );
      }, 290);
    }
  }, [distortionMix, enabled, muted, paused, hearingLevel]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (intrusiveTimerRef.current) {
      window.clearTimeout(intrusiveTimerRef.current);
      intrusiveTimerRef.current = null;
    }

    const active =
      enabled && !muted && !paused && intrusiveThoughtsEnabled && hearingLevel >= 12 && intrusiveMix > 0;
    if (!active) return;

    const scheduleThought = (): void => {
      intrusiveTimerRef.current = window.setTimeout(() => {
        const stillActive = enabled && !muted && !paused && intrusiveThoughtsEnabled && hearingLevel >= 12;
        if (!stillActive) return;

        const synthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(
          INTRUSIVE_THOUGHTS[Math.floor(Math.random() * INTRUSIVE_THOUGHTS.length)],
        );
        const voice = pickIntrusiveVoice(synthesis.getVoices());

        utterance.voice = voice;
        utterance.lang = voice?.lang ?? 'en-US';
        utterance.pitch = 1.12 + Math.random() * 0.08;
        utterance.rate = 0.84 + Math.random() * 0.08;
        utterance.volume = Math.min(0.86, 0.36 + hearingLevel / 150) * intrusiveMix;

        synthesis.speak(utterance);
        scheduleThought();
      }, nextIntrusiveDelay(hearingLevel));
    };

    scheduleThought();

    return () => {
      if (intrusiveTimerRef.current) {
        window.clearTimeout(intrusiveTimerRef.current);
        intrusiveTimerRef.current = null;
      }
    };
  }, [enabled, intrusiveMix, intrusiveThoughtsEnabled, muted, paused, hearingLevel]);

  const triggerCrossSensoryTone = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    if (muted || paused || !enabled || synesthesiaLevel <= 0 || distortionMix <= 0) return;

    const now = nodes.context.currentTime;
    const gain = nodes.context.createGain();
    gain.gain.value = 0;
    gain.connect(nodes.masterGain);

    const osc = nodes.context.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 320 + synesthesiaLevel * 4 + Math.random() * 120;
    osc.connect(gain);

    const peak = (0.008 + synesthesiaLevel / 6200) * distortionMix;
    gain.gain.linearRampToValueAtTime(peak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.start(now);
    osc.stop(now + 0.2);
  }, [distortionMix, enabled, muted, paused, synesthesiaLevel]);

  return { triggerCrossSensoryTone };
}
