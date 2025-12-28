// js/main.js
// Global UI wiring: clocks, theme, helpers

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const fmt2 = (n) => String(n).padStart(2, "0");

export function nowUtc() {
  const d = new Date();
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}

export function formatHMS(date) {
  return `${fmt2(date.getUTCHours())}:${fmt2(date.getUTCMinutes())}:${fmt2(date.getUTCSeconds())}`;
}

// Mission Elapsed Time: start at page load for a "session"
const metStart = performance.now();

export function getMET() {
  const ms = performance.now() - metStart;
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${fmt2(hh)}:${fmt2(mm)}:${fmt2(ss)}`;
}

export function setThemeAlert(on) {
  document.body.classList.toggle("theme-alert", !!on);
}

export function setLowPower(on) {
  document.body.dataset.lowPower = on ? "1" : "0";
  document.body.classList.toggle("is-lowpower", !!on);
}

export function isLowPower() {
  return document.body.dataset.lowPower === "1";
}

export function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function safeScrollToBottom(el) {
  try {
    el.scrollTop = el.scrollHeight;
  } catch {}
}

function tickClocks() {
  const utcEl = $("#utcTime");
  if (utcEl) utcEl.textContent = formatHMS(nowUtc());

  const metEl = $("#metTime");
  if (metEl) metEl.textContent = getMET();
}

function bindGlobalCloseHandlers() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = $("#moduleModal");
      if (modal && modal.classList.contains("is-open")) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      }
    }
  });
}

function init() {
  tickClocks();
  setInterval(tickClocks, 250);

  // Low power default if reduced motion
  if (prefersReducedMotion()) setLowPower(true);

  bindGlobalCloseHandlers();
}

init();
