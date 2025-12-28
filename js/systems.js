// js/systems.js
// Systems page wiring + terminal logs + diagnostics actions

import { on } from "./sim.js";
import { safeScrollToBottom } from "./main.js";

const $ = (id) => document.getElementById(id);

function setBadge(badgeEl, status) {
  if (!badgeEl) return;
  badgeEl.classList.remove("badge--ok", "badge--warn", "badge--crit", "badge--scan");

  if (status === "ok") badgeEl.classList.add("badge--ok");
  if (status === "warn") badgeEl.classList.add("badge--warn");
  if (status === "crit") badgeEl.classList.add("badge--crit");
  if (status === "scan") badgeEl.classList.add("badge--scan");
}

function setBar(el, pct) {
  if (!el) return;
  el.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

function addTermLine(kind, t, tag, msg) {
  const log = $("systemsLog");
  if (!log) return;

  const div = document.createElement("div");
  div.className = `termline termline--${kind}`;
  div.innerHTML = `
    <span class="termline__t">[${t}]</span>
    <span class="termline__tag">[${tag}]</span>
    <span class="termline__msg">${msg}</span>
  `;
  log.appendChild(div);

  while (log.children.length > 60) log.removeChild(log.firstElementChild);

  safeScrollToBottom(log);
}

function randomId() {
  const a = Math.random().toString(16).slice(2, 5).toUpperCase();
  const b = Math.random().toString(16).slice(2, 5).toUpperCase();
  return `${a}-${b}`;
}

function initMeta() {
  const sid = $("sessionId");
  const ls = $("logStart");
  if (sid) sid.textContent = `8X9-${randomId()}`;
  if (ls) ls.textContent = `${new Date().toISOString().slice(11, 19)} UTC`;
}

function initSeedLogs() {
  const seed = [
    ["sys", "14:02:55", "SYS", "Life Support heartbeat check complete. All metrics nominal."],
    ["info", "14:03:01", "INFO", "Crew Member 04 (J. Doe) accessed Airlock C."],
    ["warn", "14:03:10", "WARN", "Power Bus A voltage fluctuation detected (-12%). Initiating compensation protocols."],
    ["sys", "14:03:12", "SYS", "Rerouting auxiliary power from Sector 4."],
    ["sys", "14:03:15", "SYS", "Diagnostic tool started on COMMS_MODULE."],
    ["err", "14:03:45", "ERR", "NAV_MODULE_04 Not Responding. Connection timed out (5000ms)."],
    ["crit", "14:03:46", "CRIT", "GYROSCOPE SYNC FAILURE. Trajectory drift exceeding safety limits."],
    ["warn", "14:03:50", "WARN", "Auto-pilot disengaged. Manual control required."],
    ["sys", "14:04:02", "SYS", "Attempting to restart NAV_MODULE_04... (Attempt 1/3)."],
    ["err", "14:04:05", "ERR", "Restart failed. Hardware lock detected."],
  ];
  seed.forEach(([k, t, tag, m]) => addTermLine(k, t, tag, m));
}

function render(state) {
  // Life Support
  const lsStatus = $("lifeSupportStatus");
  setBadge(lsStatus, state.lss.status);
  if (lsStatus) lsStatus.textContent = state.lss.status === "ok" ? "STATUS: OK" : "STATUS: WARNING";

  $("lsO2") && ($("lsO2").textContent = Math.round(state.lss.o2));
  $("lsPressure") && ($("lsPressure").textContent = Math.round(state.lss.pressure));
  $("lsCo2State") && ($("lsCo2State").textContent = state.lss.co2 > 80 ? "ACTIVE / NOMINAL" : "ACTIVE / DEGRADED");

  setBar($("lsO2Bar"), state.lss.o2);
  setBar($("lsPressureBar"), (state.lss.pressure / 103) * 100);
  setBar($("lsCo2Bar"), state.lss.co2);

  // Power
  const pwStatus = $("powerStatus");
  setBadge(pwStatus, state.power.status);
  if (pwStatus) pwStatus.textContent = state.power.status === "warn" ? "WARNING" : "STATUS: OK";

  $("pwOutput") && ($("pwOutput").textContent = Math.round(state.power.output));
  setBar($("pwOutputBar"), state.power.output);

  $("pwDrainState") && ($("pwDrainState").textContent = state.power.draining);

  // Battery pips
  const pips = $("pwBatteryPips");
  if (pips && pips.children.length === 0) {
    for (let i = 0; i < 4; i++) {
      const p = document.createElement("div");
      p.className = "pip";
      pips.appendChild(p);
    }
  }
  if (pips) {
    [...pips.children].forEach((el, i) => {
      el.classList.toggle("is-on", i < state.power.batteries);
    });
  }

  // Comms
  const cStatus = $("commsStatus");
  setBadge(cStatus, state.comms.status === "ok" ? "ok" : "scan");
  if (cStatus) cStatus.textContent = state.comms.status === "ok" ? "STATUS: OK" : "SCANNING";
  $("commsProgressPct") && ($("commsProgressPct").textContent = `${Math.round(state.comms.progress)}%`);
  $("commsEta") && ($("commsEta").textContent = `00:${String(state.comms.etaSec).padStart(2, "0")}`);
  setBar($("commsProgressBar"), state.comms.progress);

  // Nav
  const nStatus = $("navStatus");
  setBadge(nStatus, state.nav.status);
  if (nStatus) nStatus.textContent = state.nav.status === "crit" ? "CRITICAL" : "WARNING";
  $("navDrift") && ($("navDrift").textContent = state.nav.drift.toFixed(1));
  $("navStabilizers") && ($("navStabilizers").textContent = state.nav.stabilizers);
}

function bindActions() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const target = btn.dataset.target || "SYSTEM";
    const t = new Date().toISOString().slice(11, 19);

    if (action === "diagnostic") {
      addTermLine("sys", t, "SYS", `Diagnostic tool started on ${target.toUpperCase()}_MODULE.`);
      addTermLine("info", t, "INFO", "Collecting telemetry snapshot…");
      setTimeout(() => addTermLine("sys", t, "SYS", "Diagnostics complete. No anomalies found."), 900);
    }

    if (action === "isolate") {
      addTermLine("warn", t, "WARN", `Isolating ${target.toUpperCase()} loop requested.`);
      setTimeout(() => addTermLine("sys", t, "SYS", `Isolation complete. Power rerouted.`), 700);
    }

    if (action === "manual") {
      addTermLine("crit", t, "CRIT", "Manual control required. Awaiting operator input.");
    }
  });

  const exportBtn = $("exportLogsBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const log = $("systemsLog");
      const text = log ? log.innerText : "";
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "system_logs.txt";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const resetBtn = $("globalResetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      addTermLine("sys", new Date().toISOString().slice(11, 19), "SYS", "GLOBAL RESET initiated.");
      setTimeout(() => addTermLine("sys", new Date().toISOString().slice(11, 19), "SYS", "Subsystems re-synchronized."), 800);
    });
  }
}

function init() {
  if (!document.querySelector('[data-page="systems"]')) return;
  initMeta();
  initSeedLogs();
  bindActions();

  on("tick", (s) => render(s));
}

init();
