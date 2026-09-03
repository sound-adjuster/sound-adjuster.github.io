(function (root) {
  'use strict';
  const clamp = (value, min, max, fallback) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  function normalize(value = {}) {
    if (!value || typeof value !== 'object') value = {};
    return { gain: clamp(value.gain, 0, 5, 1), pan: clamp(value.pan, -1, 1, 0), mono: value.mono === true, flip: value.flip === true, eq: Array.from({ length: 5 }, (_, i) => clamp(value.eq?.[i], -20, 20, 0)) };
  }
  function matrix(mono, flip) { return mono ? [0.5, 0.5, 0.5, 0.5] : flip ? [0, 1, 1, 0] : [1, 0, 0, 1]; }
  function readSaved(text) {
    try {
      const saved = JSON.parse(text);
      if (!saved || saved.version !== 1) return { remember: false, settings: normalize(), profiles: [] };
      const profiles = Array.isArray(saved.profiles) ? saved.profiles.filter(p => p && typeof p.name === 'string' && p.name.trim()).slice(0, 12).map(p => ({ name: p.name.trim().slice(0, 32), settings: normalize(p.settings) })) : [];
      return { remember: saved.remember === true, settings: saved.remember === true ? normalize(saved.settings) : normalize(), profiles };
    } catch { return { remember: false, settings: normalize(), profiles: [] }; }
  }
  // Original, quiet eight-second stereo phrase, synthesized locally on demand.
  function makeSample(sampleRate) {
    const length = Math.round(sampleRate * 8);
    const channels = [new Float32Array(length), new Float32Array(length)];
    const melody = [60, 64, 67, 71, 69, 67, 64, 62, 57, 60, 64, 67, 65, 64, 60, 59];
    for (let note = 0; note < melody.length; note++) {
      const frequency = 440 * 2 ** ((melody[note] - 69) / 12);
      const start = Math.round(note * 0.5 * sampleRate);
      const duration = Math.min(Math.round(1.25 * sampleRate), length - start);
      for (let i = 0; i < duration; i++) {
        const t = i / sampleRate;
        const envelope = (1 - Math.exp(-t * 100)) * Math.exp(-t * 5) * Math.min(1, (duration - i) / (sampleRate * 0.03));
        const phase = 2 * Math.PI * frequency * t;
        const tone = (Math.sin(phase) + 0.32 * Math.sin(2 * phase) + 0.12 * Math.sin(4 * phase) + 0.045 * Math.sin(8 * phase)) * envelope;
        channels[0][start + i] += tone * (note % 2 ? 0.7 : 1);
        channels[1][start + i] += tone * (note % 2 ? 1 : 0.7);
        const bass = Math.sin(phase * 0.25) * envelope * 0.3;
        channels[0][start + i] += bass; channels[1][start + i] += bass;
      }
    }
    let peak = 0;
    for (const channel of channels) for (const value of channel) peak = Math.max(peak, Math.abs(value));
    for (const channel of channels) for (let i = 0; i < length; i++) channel[i] *= 0.055 / Math.max(peak, 1);
    return channels;
  }
  const api = { normalize, matrix, readSaved, makeSample };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoundAdjusterDemo = api;
})(globalThis);
