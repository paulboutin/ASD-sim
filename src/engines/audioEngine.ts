import { useCallback, useEffect, useRef } from 'react';

interface AudioControls {
  enabled: boolean;
  muted: boolean;
  paused: boolean;
  hearingLevel: number;
  synesthesiaLevel: number;
}

interface AudioNodes {
  context: AudioContext;
  masterGain: GainNode;
  buzzOsc: OscillatorNode;
  buzzGain: GainNode;
  toneOsc: OscillatorNode;
  toneGain: GainNode;
  noiseFilter: BiquadFilterNode;
  noiseSource: AudioBufferSourceNode;
  noiseGain: GainNode;
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

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(context);
  noiseSource.loop = true;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(masterGain);

  buzzOsc.start();
  toneOsc.start();
  noiseSource.start();

  return {
    context,
    masterGain,
    buzzOsc,
    buzzGain,
    toneOsc,
    toneGain,
    noiseFilter,
    noiseSource,
    noiseGain,
  };
}

export function useAudioEngine({
  enabled,
  muted,
  paused,
  hearingLevel,
  synesthesiaLevel,
}: AudioControls): { triggerCrossSensoryTone: () => void } {
  const nodesRef = useRef<AudioNodes | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || nodesRef.current) return;

    nodesRef.current = setupAudioGraph();

    return () => {
      const nodes = nodesRef.current;
      if (!nodes) return;
      nodes.buzzOsc.stop();
      nodes.toneOsc.stop();
      nodes.noiseSource.stop();
      void nodes.context.close();
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

    nodes.masterGain.gain.setTargetAtTime(active ? 0.8 : 0, nodes.context.currentTime, 0.06);
    nodes.buzzGain.gain.setTargetAtTime(active ? hearingMix * 0.045 : 0, nodes.context.currentTime, 0.08);
    nodes.toneGain.gain.setTargetAtTime(active ? hearingMix * 0.03 : 0, nodes.context.currentTime, 0.08);
    nodes.noiseGain.gain.setTargetAtTime(active ? hearingMix * 0.05 : 0, nodes.context.currentTime, 0.08);

    nodes.toneOsc.frequency.setTargetAtTime(150 + hearingLevel * 2.8, nodes.context.currentTime, 0.1);
    nodes.noiseFilter.frequency.setTargetAtTime(220 + hearingLevel * 5, nodes.context.currentTime, 0.1);
  }, [enabled, muted, paused, hearingLevel]);

  const triggerCrossSensoryTone = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    if (muted || paused || !enabled || synesthesiaLevel <= 0) return;

    const now = nodes.context.currentTime;
    const gain = nodes.context.createGain();
    gain.gain.value = 0;
    gain.connect(nodes.masterGain);

    const osc = nodes.context.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 320 + synesthesiaLevel * 4 + Math.random() * 120;
    osc.connect(gain);

    const peak = 0.008 + synesthesiaLevel / 6200;
    gain.gain.linearRampToValueAtTime(peak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.start(now);
    osc.stop(now + 0.2);
  }, [enabled, muted, paused, synesthesiaLevel]);

  return { triggerCrossSensoryTone };
}
