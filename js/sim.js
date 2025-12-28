// js/sim.js
// Lightweight simulation engine + event bus

import { isLowPower } from "./main.js";

const listeners = new Map();

export function on(evt, cb) {
  if (!listeners.has(evt)) listeners.set(evt, new Set());
  listeners.get(evt).add(cb);
  return () => listeners.get(evt)?.delete(cb);
}

export function emit(evt, payload) {
  listeners.get(evt)?.forEach((cb) => cb(payload));
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function jitter(scale) {
  return (Math.random() - 0.5) * 2 * scale;
}

function roll(p) {
  return Math.random() < p;
}

const state = {
  // Dashboard KPIs
  altitudeKm: 408.0,
  speedKms: 7.66,
  oxygenPct: 98.4,
  energyPct: 82.0,

  // Systems metrics
  lss: { o2: 98, pressure: 101, co2: 88, status: "ok" },
  power: { output: 74, batteries: 3, draining: "—", status: "warn" },
  comms: { progress: 0, etaSec: 12, status: "scan" },
  nav: { drift: 4.2, stabilizers: "OFFLINE", status: "crit" },

  // Global status
  global: "ok",

  // Controls
  orbitCycle: false,
  lowPower: false,
  redAlert: false,

  // Coords
  coords: { x: 402.11, y: -89.2, z: 12.04 },
};

export function getState() {
  return structuredClone(state);
}

export function setControl(key, value) {
  if (!(key in state)) return;
  state[key] = value;

  if (key === "lowPower") emit("lowpower", value);
  if (key === "redAlert") emit("redalert", value);

  emit("control", { key, value });
}

function updateGlobalStatus() {
  // If nav critical => global critical
  if (state.nav.status === "crit" || state.redAlert) {
    state.global = "crit";
    return;
  }
  // If power warning => global warn
  if (state.power.status === "warn") {
    state.global = "warn";
    return;
  }
  state.global = "ok";
}

function stepDashboard(dt) {
  // dt in seconds
  const lp = state.lowPower || isLowPower();

  const aScale = lp ? 0.02 : 0.06;
  const sScale = lp ? 0.002 : 0.006;
  const oScale = lp ? 0.015 : 0.04;
  const eScale = lp ? 0.03 : 0.08;

  state.altitudeKm = clamp(state.altitudeKm + jitter(aScale), 398, 418);
  state.speedKms = clamp(state.speedKms + jitter(sScale), 7.55, 7.75);
  state.oxygenPct = clamp(state.oxygenPct + jitter(oScale), 93.5, 99.9);
  state.energyPct = clamp(state.energyPct + jitter(eScale) - 0.005, 55, 98);

  // coords subtle drift
  state.coords.x = clamp(state.coords.x + jitter(0.08), 350, 470);
  state.coords.y = clamp(state.coords.y + jitter(0.08), -140, -30);
  state.coords.z = clamp(state.coords.z + jitter(0.06), 0, 40);
}

function stepSystems(dt) {
  const lp = state.lowPower || isLowPower();

  // Life support
  state.lss.o2 = clamp(state.lss.o2 + jitter(lp ? 0.02 : 0.05), 93, 99);
  state.lss.pressure = clamp(state.lss.pressure + jitter(lp ? 0.02 : 0.06), 98, 103);
  state.lss.co2 = clamp(state.lss.co2 + jitter(lp ? 0.03 : 0.09), 70, 98);
  state.lss.status = state.lss.o2 < 95 || state.lss.pressure < 99 ? "warn" : "ok";

  // Power grid stays warning often (like mock)
  state.power.output = clamp(state.power.output + jitter(lp ? 0.05 : 0.12), 55, 92);
  if (state.power.output < 62) state.power.status = "warn";
  if (state.power.output > 75) state.power.status = "warn"; // keep it warn per UI
  state.power.batteries = clamp(state.power.batteries + (roll(0.02) ? (roll(0.5) ? 1 : -1) : 0), 1, 4);
  state.power.draining = state.power.output < 70 ? "DRAINING" : "STABLE";

  // Comms progress
  if (state.comms.status === "scan") {
    const speed = lp ? 0.6 : 1.2;
    state.comms.progress = clamp(state.comms.progress + speed, 0, 100);
    state.comms.etaSec = Math.max(0, Math.round((100 - state.comms.progress) / speed));
    if (state.comms.progress >= 100) {
      state.comms.progress = 100;
      state.comms.status = "ok";
    }
  } else {
    // occasionally restart scan
    if (roll(lp ? 0.005 : 0.01)) {
      state.comms.status = "scan";
      state.comms.progress = 0;
      state.comms.etaSec = 12;
    }
  }

  // Nav is critical sometimes
  if (!state.redAlert) {
    state.nav.drift = clamp(state.nav.drift + jitter(lp ? 0.01 : 0.03), 0.8, 7.8);
    state.nav.status = state.nav.drift > 3.8 ? "crit" : "warn";
    state.nav.stabilizers = state.nav.status === "crit" ? "OFFLINE" : "DEGRADED";
  } else {
    state.nav.status = "crit";
    state.nav.stabilizers = "OFFLINE";
  }

  updateGlobalStatus();
}

let last = performance.now();

function loop() {
  const now = performance.now();
  const dt = (now - last) / 1000;
  last = now;

  // lower tick rate in low power
  const lp = state.lowPower || isLowPower();
  const emitEvery = lp ? 650 : 280;

  stepDashboard(dt);
  stepSystems(dt);

  emit("tick", getState());

  setTimeout(loop, emitEvery);
}

export function startSim() {
  loop();
}

// Auto-start
startSim();
