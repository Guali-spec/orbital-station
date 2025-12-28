// js/crew.js
// Crew list + filters + station schematic + modal checklist persistence

import { safeScrollToBottom } from "./main.js";

const $ = (id) => document.getElementById(id);

const CREW = [
  {
    id: "c1",
    name: "Cmdr. Sarah Jenkins",
    role: "cmd",
    title: "Mission Commander",
    status: "on",
    shift: "SHIFT A",
    location: "BRIDGE",
  },
  {
    id: "c2",
    name: "Lt. Mike Ross",
    role: "eng",
    title: "Chief Engineer",
    status: "on",
    shift: "SHIFT A",
    location: "AIRLOCK C",
    meta: "EVA",
  },
  {
    id: "c3",
    name: "Dr. Aris Thorne",
    role: "med",
    title: "Medical Officer",
    status: "rest",
    shift: "SHIFT B",
    location: "QUARTERS",
  },
  {
    id: "c4",
    name: "Spec. Li Chen",
    role: "eng",
    title: "Payload Specialist",
    status: "off",
    shift: "SHIFT C",
    location: "COMMONS",
  },
];

const MODULES = [
  {
    id: "dock",
    label: "DOCKING",
    x: 58,
    y: 70,
    status: "nominal",
    desc: "Docking clamps, airlocks and approach guidance systems.",
    checklist: ["Clamp alignment check", "Seal integrity scan", "Approach beacon test"],
  },
  {
    id: "hab",
    label: "HABITATION",
    x: 160,
    y: 210,
    status: "nominal",
    desc: "Crew quarters, life support distribution and common areas.",
    checklist: ["CO2 scrubbers nominal", "Water reclamation stable", "Lighting cycle ok"],
  },
  {
    id: "bio",
    label: "BIO-LAB",
    x: 430,
    y: 210,
    status: "warning",
    desc: "Microgravity experiments, specimen storage, sterile environment controls.",
    checklist: ["Sterile pressure lock", "Freezer array temp", "Sample manifest verified"],
  },
  {
    id: "obs",
    label: "OBSERVATORY",
    x: 520,
    y: 210,
    status: "nominal",
    desc: "Telescope alignment, sensor suite and deep-space observation tools.",
    checklist: ["Lens heater check", "Star tracker sync", "Sensor calibration"],
  },
  {
    id: "eng",
    label: "ENGINEERING",
    x: 330,
    y: 395,
    status: "warning",
    desc: "Power distribution, propulsion maintenance and robotics bay.",
    checklist: ["Loop B voltage", "Battery reserve test", "Robotic arm articulation"],
  },
  {
    id: "core",
    label: "CORE HUB",
    x: 330,
    y: 240,
    status: "nominal",
    core: true,
    desc: "Primary junction: routing, comms backbone and station command.",
    checklist: ["Backbone latency", "Command uplink secure", "Core thermal stable"],
  },
];

function statusBadgeClass(status) {
  if (status === "on") return "shiftbadge shiftbadge--on";
  if (status === "rest") return "shiftbadge shiftbadge--rest";
  return "shiftbadge shiftbadge--off";
}

function statusLabel(status) {
  if (status === "on") return "ON-DUTY";
  if (status === "rest") return "RESTING";
  return "OFF-DUTY";
}

function renderCrew(list) {
  const wrap = $("crewList");
  if (!wrap) return;
  wrap.innerHTML = "";

  list.forEach((m) => {
    const card = document.createElement("div");
    card.className = "crewcard";
    card.innerHTML = `
      <div class="crewcard__avatar" aria-hidden="true">👤</div>
      <div class="crewcard__body">
        <div class="crewcard__name">${m.name}</div>
        <div class="crewcard__role">${m.title}</div>
        <div class="crewcard__meta">
          <span>${m.shift}</span>
          <span>◆</span>
          <span>${m.location}</span>
          ${m.meta ? `<span>◆</span><span>${m.meta}</span>` : ""}
        </div>
      </div>
      <div class="${statusBadgeClass(m.status)}">${statusLabel(m.status)}</div>
    `;
    wrap.appendChild(card);
  });

  const occ = $("occupancy");
  if (occ) occ.textContent = `${list.length}/8`;
}

function moduleClass(m) {
  if (m.core) return "module-node module-node--core";
  return `module-node module-node--${m.status}`;
}

function renderModules() {
  const map = $("moduleMap");
  if (!map) return;
  map.innerHTML = "";

  // simple connector lines with CSS? (optional)
  MODULES.forEach((m) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = moduleClass(m);
    node.style.left = `${m.x}px`;
    node.style.top = `${m.y}px`;
    node.dataset.moduleId = m.id;
    node.setAttribute("aria-label", `Module ${m.label}`);

    node.innerHTML = `
      <span class="module-node__label">${m.label}</span>
      <span aria-hidden="true">${m.core ? "⬣" : "▣"}</span>
    `;
    map.appendChild(node);
  });
}

function storageKey(moduleId) {
  return `orbital.checklist.${moduleId}`;
}

function loadChecklistState(moduleId, items) {
  try {
    const raw = localStorage.getItem(storageKey(moduleId));
    if (!raw) return items.map(() => false);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return items.map(() => false);
    return items.map((_, i) => !!parsed[i]);
  } catch {
    return items.map(() => false);
  }
}

function saveChecklistState(moduleId, arr) {
  localStorage.setItem(storageKey(moduleId), JSON.stringify(arr));
}

let currentModule = null;

function openModuleModal(m) {
  currentModule = m;

  const modal = $("moduleModal");
  if (!modal) return;

  $("moduleModalTitle").textContent = m.label;
  $("moduleModalDesc").textContent = m.desc;

  const wrap = $("moduleChecklist");
  wrap.innerHTML = "";

  const state = loadChecklistState(m.id, m.checklist);

  m.checklist.forEach((label, idx) => {
    const row = document.createElement("label");
    row.className = "ckitem";
    row.innerHTML = `
      <input type="checkbox" data-ck="${idx}" ${state[idx] ? "checked" : ""} />
      <span class="ckitem__label">${label}</span>
    `;
    wrap.appendChild(row);
  });

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");

  // focus first input
  const first = wrap.querySelector("input");
  first?.focus();
}

function closeModuleModal() {
  const modal = $("moduleModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  currentModule = null;
}

function bindModal() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-close]");
    if (btn && btn.dataset.close === "modal") closeModuleModal();
  });

  const saveBtn = $("saveChecklistBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!currentModule) return;
      const wrap = $("moduleChecklist");
      const checks = [...wrap.querySelectorAll("input[type=checkbox]")].map((i) => i.checked);
      saveChecklistState(currentModule.id, checks);
      closeModuleModal();
    });
  }
}

function bindModuleClicks() {
  const map = $("moduleMap");
  if (!map) return;

  map.addEventListener("click", (e) => {
    const node = e.target.closest(".module-node");
    if (!node) return;

    const m = MODULES.find((x) => x.id === node.dataset.moduleId);
    if (m) openModuleModal(m);
  });
}

function bindFilters() {
  const search = $("crewSearch");
  const seg = document.querySelector(".segmented");
  let role = "all";
  let q = "";

  function apply() {
    const list = CREW.filter((m) => (role === "all" ? true : m.role === role))
      .filter((m) => m.name.toLowerCase().includes(q) || m.title.toLowerCase().includes(q));
    renderCrew(list);
  }

  if (search) {
    search.addEventListener("input", (e) => {
      q = e.target.value.trim().toLowerCase();
      apply();
    });
  }

  if (seg) {
    seg.addEventListener("click", (e) => {
      const btn = e.target.closest(".segmented__btn");
      if (!btn) return;
      role = btn.dataset.role;

      [...seg.querySelectorAll(".segmented__btn")].forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      apply();
    });
  }

  apply();
}

function init() {
  if (!document.querySelector('[data-page="crew"]')) return;

  renderModules();
  bindModuleClicks();
  bindModal();
  bindFilters();
}

init();
