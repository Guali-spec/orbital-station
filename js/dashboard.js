// js/dashboard.js
// Dashboard wiring: KPIs, coords, controls, logs

import { on, setControl } from "./sim.js";
import { setThemeAlert, setLowPower, safeScrollToBottom } from "./main.js";

const $ = (id) => document.getElementById(id);

function setChip(status) {
  const chip = $("globalStatusChip");
  const label = $("globalStatusLabel");
  if (!chip || !label) return;

  chip.classList.remove("statuschip--ok", "statuschip--warn", "statuschip--crit");

  if (status === "ok") {
    chip.classList.add("statuschip--ok");
    label.textContent = "OPERATIONAL";
  } else if (status === "warn") {
    chip.classList.add("statuschip--warn");
    label.textContent = "DEGRADED";
  } else {
    chip.classList.add("statuschip--crit");
    label.textContent = "CRITICAL";
  }
}

function fmt(n, digits = 0) {
  return n.toFixed(digits);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function addDashLogLine(kind, time, msg) {
  const log = $("dashLog");
  if (!log) return;

  const line = document.createElement("div");
  line.className = `logline logline--${kind}`;
  line.innerHTML = `
    <div class="logline__t">${time}</div>
    <div class="logline__m">${msg}</div>
  `;

  log.appendChild(line);

  // cap lines
  while (log.children.length > 10) log.removeChild(log.firstElementChild);

  safeScrollToBottom(log);
}

function wireControls() {
  const orbitCycleToggle = $("orbitCycleToggle");
  const lowPowerToggle = $("lowPowerToggle");
  const redAlertToggle = $("redAlertToggle");

  if (orbitCycleToggle) {
    orbitCycleToggle.addEventListener("change", (e) => {
      setControl("orbitCycle", e.target.checked);
      addDashLogLine("info", "--:--:--", `Orbit cycle ${e.target.checked ? "enabled" : "disabled"}.`);
    });
  }

  if (lowPowerToggle) {
    lowPowerToggle.addEventListener("change", (e) => {
      setControl("lowPower", e.target.checked);
      setLowPower(e.target.checked);
      addDashLogLine("warn", "--:--:--", `Low power ${e.target.checked ? "enabled" : "disabled"}.`);
    });
  }

  if (redAlertToggle) {
    redAlertToggle.addEventListener("change", (e) => {
      setControl("redAlert", e.target.checked);
      setThemeAlert(e.target.checked);
      addDashLogLine("err", "--:--:--", `Red Alert ${e.target.checked ? "ENGAGED" : "DISENGAGED"}.`);
    });
  }
}

function deriveDelta(current, prev, unit = "") {
  const d = current - prev;
  const sign = d > 0 ? "+" : d < 0 ? "−" : "—";
  const abs = Math.abs(d);
  const val = abs < 0.001 ? "0.0" : abs.toFixed(1);
  return `${sign}${val}${unit}`;
}

let prev = null;

function bindTick() {
  on("tick", (s) => {
    // KPIs
    setText("kpiAltitude", fmt(s.altitudeKm, 0));
    setText("kpiSpeed", fmt(s.speedKms, 2));
    setText("kpiOxygen", fmt(s.oxygenPct, 1));
    setText("kpiEnergy", fmt(s.energyPct, 0));

    // coords
    setText("coordX", fmt(s.coords.x, 2));
    setText("coordY", fmt(s.coords.y, 1));
    setText("coordZ", fmt(s.coords.z, 2));

    setChip(s.global);

    // deltas
    if (prev) {
      setText("kpiAltitudeDelta", deriveDelta(s.altitudeKm, prev.altitudeKm, "%"));
      setText("kpiSpeedDelta", deriveDelta(s.speedKms, prev.speedKms, "%"));
      setText("kpiOxygenDelta", deriveDelta(s.oxygenPct, prev.oxygenPct, "%"));
      setText("kpiEnergyDelta", deriveDelta(s.energyPct, prev.energyPct, "%"));
    }

    prev = s;
  });
}

function seedLogs() {
  const base = [
    ["ok", "14:22:01", "Connection established."],
    ["info", "14:21:45", "Telemetry syncing... OK."],
    ["info", "14:20:12", "User [CMD_01] logged in."],
    ["warn", "14:19:55", "Warning: Solar Array B efficiency at 88%."],
    ["info", "14:15:30", "Routine diagnostics complete."],
    ["info", "14:10:22", "Main View camera calibrated."],
  ];
  base.forEach(([k, t, m]) => addDashLogLine(k, t, m));
}

function init() {
  if (!document.querySelector('[data-page="dashboard"]')) return;
  wireControls();
  bindTick();
  seedLogs();
}

init();
