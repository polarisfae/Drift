// ---------- Drift: an ambient, generative space ----------

const PALETTES = {
  bloom: {
    bg: [246, 241, 234],
    blobs: ['#f3b8c8', '#c9b8e8', '#f5e0a8', '#e8899f'],
    ripple: '#8a5a6b',
  },
  meadow: {
    bg: [242, 244, 234],
    blobs: ['#b8d9a8', '#a8d4d8', '#e8d98c', '#7fbf9e'],
    ripple: '#3f6b52',
  },
  dawn: {
    bg: [250, 236, 222],
    blobs: ['#ffb37a', '#ffd58c', '#ff8f7a', '#f2c9d8'],
    ripple: '#8a4a2e',
  },
};

let currentPalette = 'bloom';
let paletteFrom = PALETTES.bloom;
let paletteTo = PALETTES.bloom;
let paletteT = 1; // 0..1 transition progress

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpRGB(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ---------- Canvas / visuals ----------

const canvas = document.getElementById('scene');
const ctx2d = canvas.getContext('2d');
let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx2d.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function makeBlobs(n) {
  const blobs = [];
  for (let i = 0; i < n; i++) {
    blobs.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      baseRadius: Math.min(W, H) * (0.18 + Math.random() * 0.16),
      phase: Math.random() * Math.PI * 2,
      period: 6 + Math.random() * 6,
      colorIndex: i % 4,
    });
  }
  return blobs;
}
let blobs = makeBlobs(5);

const ripples = [];
function spawnRipple(freq) {
  ripples.push({
    x: Math.random() * W * 0.8 + W * 0.1,
    y: Math.random() * H * 0.7 + H * 0.1,
    r: 0,
    maxR: 40 + (freq / 900) * 90,
    alpha: 0.5,
  });
}

let t0 = performance.now();
function draw(now) {
  const t = (now - t0) / 1000;

  const bg = lerpRGB(paletteFrom.bg, paletteTo.bg, paletteT);
  ctx2d.fillStyle = `rgba(${bg[0] | 0}, ${bg[1] | 0}, ${bg[2] | 0}, 0.14)`;
  ctx2d.fillRect(0, 0, W, H);

  ctx2d.filter = 'blur(45px)';
  ctx2d.globalCompositeOperation = 'multiply';
  const colorsFrom = paletteFrom.blobs;
  const colorsTo = paletteTo.blobs;

  for (const b of blobs) {
    b.x += b.vx;
    b.y += b.vy;
    const margin = 100;
    if (b.x < -margin) b.x = W + margin;
    if (b.x > W + margin) b.x = -margin;
    if (b.y < -margin) b.y = H + margin;
    if (b.y > H + margin) b.y = -margin;

    const pulse = 1 + 0.18 * Math.sin((t / b.period) * Math.PI * 2 + b.phase);
    const r = b.baseRadius * pulse;

    const cFrom = hexToRgb(colorsFrom[b.colorIndex]);
    const cTo = hexToRgb(colorsTo[b.colorIndex]);
    const c = lerpRGB(cFrom, cTo, paletteT);

    const grad = ctx2d.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
    grad.addColorStop(0, `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, 0.9)`);
    grad.addColorStop(0.6, `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, 0.5)`);
    grad.addColorStop(1, `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, 0)`);
    ctx2d.fillStyle = grad;
    ctx2d.beginPath();
    ctx2d.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx2d.fill();
  }

  ctx2d.filter = 'none';
  ctx2d.globalCompositeOperation = 'source-over';

  const rippleColorHex = paletteT >= 0.5 ? paletteTo.ripple : paletteFrom.ripple;
  const rc = hexToRgb(rippleColorHex);
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.r += 0.6;
    r.alpha *= 0.975;
    if (r.alpha < 0.01 || r.r > r.maxR) {
      ripples.splice(i, 1);
      continue;
    }
    ctx2d.strokeStyle = `rgba(${rc[0]}, ${rc[1]}, ${rc[2]}, ${r.alpha})`;
    ctx2d.lineWidth = 1.4;
    ctx2d.beginPath();
    ctx2d.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx2d.stroke();
  }

  if (paletteT < 1) {
    paletteT = Math.min(1, paletteT + 0.006);
  }

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

// ---------- Film grain overlay ----------

const grainCanvas = document.getElementById('grain');
const grainCtx = grainCanvas.getContext('2d');
let grainW = 0, grainH = 0;

function resizeGrain() {
  grainW = window.innerWidth;
  grainH = window.innerHeight;
  grainCanvas.width = grainW;
  grainCanvas.height = grainH;
  grainCanvas.style.width = grainW + 'px';
  grainCanvas.style.height = grainH + 'px';
}
window.addEventListener('resize', resizeGrain);
resizeGrain();

const grainTile = document.createElement('canvas');
grainTile.width = 160;
grainTile.height = 160;
const grainTileCtx = grainTile.getContext('2d');

function renderGrainTile() {
  const imgData = grainTileCtx.createImageData(grainTile.width, grainTile.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = 128 + (Math.random() * 2 - 1) * 50;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  grainTileCtx.putImageData(imgData, 0, 0);
}

function renderGrainFrame() {
  renderGrainTile();
  const pattern = grainCtx.createPattern(grainTile, 'repeat');
  grainCtx.fillStyle = pattern;
  grainCtx.fillRect(0, 0, grainW, grainH);
}
renderGrainFrame();
setInterval(renderGrainFrame, 100);

// ---------- Audio engine ----------

let audioCtx = null;
let masterGain, rainGain, droneGain, chimeGain;
let isMuted = false;
let preMuteGain = 0.9;
let chimeTimer = null;

const PENTATONIC = [220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25];

function createNoiseBuffer(ctx) {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function createSimpleReverb(ctx) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const delayTimes = [0.31, 0.47, 0.63];
  for (const time of delayTimes) {
    const delay = ctx.createDelay(2);
    delay.delayTime.value = time;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2800;

    input.connect(delay);
    delay.connect(lowpass);
    lowpass.connect(feedback);
    feedback.connect(delay);
    lowpass.connect(output);
  }
  return { input, output };
}

function setupAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.ratio.value = 3;
  compressor.connect(audioCtx.destination);

  masterGain = audioCtx.createGain();
  masterGain.gain.value = preMuteGain;
  masterGain.connect(compressor);

  // --- Rain ---
  const noise = audioCtx.createBufferSource();
  noise.buffer = createNoiseBuffer(audioCtx);
  noise.loop = true;

  const rainBandpass = audioCtx.createBiquadFilter();
  rainBandpass.type = 'bandpass';
  rainBandpass.frequency.value = 1000;
  rainBandpass.Q.value = 0.6;

  const rainLowpass = audioCtx.createBiquadFilter();
  rainLowpass.type = 'lowpass';
  rainLowpass.frequency.value = 3200;

  const rainLFO = audioCtx.createOscillator();
  rainLFO.frequency.value = 0.07;
  const rainLFOGain = audioCtx.createGain();
  rainLFOGain.gain.value = 250;
  rainLFO.connect(rainLFOGain);
  rainLFOGain.connect(rainBandpass.frequency);
  rainLFO.start();

  rainGain = audioCtx.createGain();
  rainGain.gain.value = 0;

  noise.connect(rainBandpass);
  rainBandpass.connect(rainLowpass);
  rainLowpass.connect(rainGain);
  rainGain.connect(masterGain);
  noise.start();

  // --- Drone ---
  droneGain = audioCtx.createGain();
  droneGain.gain.value = 0;

  const droneFilter = audioCtx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 500;
  droneFilter.connect(droneGain);
  droneGain.connect(masterGain);

  const droneFilterLFO = audioCtx.createOscillator();
  droneFilterLFO.frequency.value = 0.045;
  const droneFilterLFOGain = audioCtx.createGain();
  droneFilterLFOGain.gain.value = 180;
  droneFilterLFO.connect(droneFilterLFOGain);
  droneFilterLFOGain.connect(droneFilter.frequency);
  droneFilterLFO.start();

  const droneFreqs = [55, 82.5, 110, 164.8];
  droneFreqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;

    const detuneLFO = audioCtx.createOscillator();
    detuneLFO.frequency.value = 0.03 + i * 0.01;
    const detuneLFOGain = audioCtx.createGain();
    detuneLFOGain.gain.value = 4;
    detuneLFO.connect(detuneLFOGain);
    detuneLFOGain.connect(osc.detune);
    detuneLFO.start();

    const voiceGain = audioCtx.createGain();
    voiceGain.gain.value = 0.22;

    osc.connect(voiceGain);
    voiceGain.connect(droneFilter);
    osc.start();
  });

  // --- Chimes ---
  chimeGain = audioCtx.createGain();
  chimeGain.gain.value = 0;

  const reverb = createSimpleReverb(audioCtx);
  const reverbReturn = audioCtx.createGain();
  reverbReturn.gain.value = 0.8;

  chimeGain.connect(masterGain);
  chimeGain.connect(reverb.input);
  reverb.output.connect(reverbReturn);
  reverbReturn.connect(masterGain);

  scheduleChime();
}

function playChimeNote() {
  if (!audioCtx) return;
  const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const env = audioCtx.createGain();
  const now = audioCtx.currentTime;
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.5, now + 0.03);
  env.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

  osc.connect(env);
  env.connect(chimeGain);
  osc.start(now);
  osc.stop(now + 3.4);

  spawnRipple(freq);
}

function scheduleChime() {
  const density = Number(document.getElementById('chimes').value);
  let delay;
  if (density <= 0) {
    delay = 4000;
  } else {
    const minMs = 900, maxMs = 7000;
    const factor = density / 100;
    delay = maxMs - factor * (maxMs - minMs) + Math.random() * 1500;
  }
  chimeTimer = setTimeout(() => {
    const currentDensity = Number(document.getElementById('chimes').value);
    if (currentDensity > 0) playChimeNote();
    scheduleChime();
  }, delay);
}

// ---------- UI wiring ----------

const overlay = document.getElementById('overlay');
const enterBtn = document.getElementById('enter-btn');
const app = document.getElementById('app');
const muteBtn = document.getElementById('mute-btn');

const sliderMap = {
  rain: () => rainGain,
  drone: () => droneGain,
  chimes: () => chimeGain,
};

function maxGainFor(id) {
  return { rain: 0.7, drone: 0.5, chimes: 0.9 }[id];
}

Object.keys(sliderMap).forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    const node = sliderMap[id]();
    if (node && audioCtx) {
      const v = (Number(el.value) / 100) * maxGainFor(id);
      node.gain.setTargetAtTime(v, audioCtx.currentTime, 0.4);
    }
  });
});

enterBtn.addEventListener('click', () => {
  if (!audioCtx) {
    setupAudio();
    Object.keys(sliderMap).forEach((id) => {
      const el = document.getElementById(id);
      const node = sliderMap[id]();
      const v = (Number(el.value) / 100) * maxGainFor(id);
      node.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
    });
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  overlay.classList.add('hidden');
  app.hidden = false;
});

muteBtn.addEventListener('click', () => {
  if (!audioCtx) return;
  isMuted = !isMuted;
  if (isMuted) {
    preMuteGain = masterGain.gain.value;
    masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15);
    muteBtn.textContent = '🔇';
  } else {
    masterGain.gain.setTargetAtTime(preMuteGain || 0.9, audioCtx.currentTime, 0.15);
    muteBtn.textContent = '🔊';
  }
});

document.querySelectorAll('.palette-swatch').forEach((btn) => {
  if (btn.dataset.palette === currentPalette) btn.classList.add('active');
  btn.addEventListener('click', () => {
    const name = btn.dataset.palette;
    if (name === currentPalette) return;
    paletteFrom = { ...PALETTES[currentPalette] };
    // capture the actual current blend as the new "from" so transitions don't jump
    const blended = { bg: lerpRGB(paletteFrom.bg, paletteTo.bg, paletteT), blobs: [], ripple: paletteT >= 0.5 ? paletteTo.ripple : paletteFrom.ripple };
    for (let i = 0; i < 4; i++) {
      const a = hexToRgb(paletteFrom.blobs[i]);
      const b = hexToRgb(paletteTo.blobs[i]);
      const c = lerpRGB(a, b, paletteT);
      blended.blobs.push(`rgb(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0})`);
    }
    paletteFrom = blended;
    paletteTo = PALETTES[name];
    paletteT = 0;
    currentPalette = name;
    document.querySelectorAll('.palette-swatch').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
