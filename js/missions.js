// js/missions.js
// Missions timeline + logbook persistence + filter + simple encode/decode

const $ = (id) => document.getElementById(id);

const MISSIONS = [
  {
    date: "2049-10-12",
    title: "Orbital Insertion",
    desc: "Successful establishment of stable orbit at altitude 408km.",
    status: "completed",
  },
  {
    date: "2049-10-15",
    title: "Station Docking",
    desc: "Modules Alpha and Beta successfully linked via docking port 1.",
    status: "completed",
  },
  {
    date: "2049-10-24",
    title: "Solar Array Repair",
    desc: "EVA team deployed to replace damaged panels on Sector 4.",
    status: "active",
    progress: 65,
  },
  {
    date: "2049-11-01",
    title: "Cargo Resupply",
    desc: "Arrival of supply ship “Hermes” with provisions and science payload.",
    status: "scheduled",
  },
];

const defaultLogs = [
  {
    id: "l1",
    title: "Hull Pressure Fluctuation",
    priority: "high",
    msg: "Sensors in Sector 7 detected a 2% drop in atmospheric pressure. Automated sealing protocols engaged. Engineer team dispatched for visual inspection.",
    utc: "14:02 UTC",
    author: "Cmdr. Jenkins",
  },
  {
    id: "l2",
    title: "Life Support Maintenance",
    priority: "medium",
    msg: "Routine filter replacement for CO2 scrubbers in Habitation Module completed. Efficiency increased by 0.5%. Next scheduled check in 48 hours.",
    utc: "12:30 UTC",
    author: "Dr. Thorne",
  },
  {
    id: "l3",
    title: "Daily Inventory Check",
    priority: "low",
    msg: "Food rations inventory updated. Water reclamation levels nominal. Spare parts for comms array cataloged and stored in Cargo Bay 2.",
    utc: "09:15 UTC",
    author: "Spec. Chen",
  },
  {
    id: "l4",
    title: "Crew Physicals",
    priority: "low",
    msg: "Monthly bone density scans completed for Shift A. No significant degradation detected. Exercise regimen adjusted for Lt. Ross.",
    utc: "08:00 UTC",
    author: "Dr. Thorne",
  },
];

const LS_KEY = "orbital.logbook.v1";

function loadLogs() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [...defaultLogs];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...defaultLogs];
    return parsed;
  } catch {
    return [...defaultLogs];
  }
}

function saveLogs(logs) {
  localStorage.setItem(LS_KEY, JSON.stringify(logs));
}

function prioLabel(p) {
  if (p === "high") return "HIGH PRIORITY";
  if (p === "medium") return "MEDIUM PRIORITY";
  return "LOW PRIORITY";
}

function renderTimeline() {
  const wrap = $("missionTimeline");
  if (!wrap) return;
  wrap.innerHTML = "";

  MISSIONS.forEach((m) => {
    const card = document.createElement("div");
    card.className = "missioncard";

    const statusClass =
      m.status === "active"
        ? "missioncard__status missioncard__status--active"
        : m.status === "completed"
        ? "missioncard__status missioncard__status--completed"
        : "missioncard__status missioncard__status--scheduled";

    card.innerHTML = `
      <div class="missioncard__date">${m.date}</div>
      <div class="${statusClass}">${m.status.toUpperCase()}</div>
      <div class="missioncard__title">${m.title}</div>
      <div class="missioncard__desc">${m.desc}</div>
      ${
        m.status === "active"
          ? `
        <div class="missioncard__progress">
          <div class="bar bar--thick"><div class="bar__fill" style="width:${m.progress}%"></div></div>
          <div class="missioncard__progressLabel">${m.progress}% COMPLETE</div>
        </div>`
          : ""
      }
    `;
    wrap.appendChild(card);
  });

  const active = MISSIONS.filter((m) => m.status === "active").length;
  $("activeMissions") && ($("activeMissions").textContent = String(active));
}

function renderLogs(filter = "all") {
  const wrap = $("logList");
  if (!wrap) return;

  const logs = loadLogs();
  wrap.innerHTML = "";

  const visible = filter === "all" ? logs : logs.filter((l) => l.priority === filter);

  visible.forEach((l) => {
    const entry = document.createElement("div");
    entry.className = "logentry";
    entry.innerHTML = `
      <div class="prio prio--${l.priority}">${prioLabel(l.priority)}</div>
      <div class="logentry__title">${l.title}</div>
      <div class="logentry__msg">${l.msg}</div>
      <div class="logentry__meta">
        <div>${l.utc}</div>
        <div>${l.author}</div>
      </div>
    `;
    wrap.appendChild(entry);
  });

  // For the "UNREAD LOGS" pill we keep it simple: count logs created today in session
  $("unreadLogs") && ($("unreadLogs").textContent = String(Math.min(visible.length, 9)));
}

function bindLogForm() {
  const form = $("logForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = $("logTitle").value.trim();
    const priority = $("logPriority").value;
    const msg = $("logMessage").value.trim();
    const auth = $("authCode").value.trim() || "CM-0000";

    const logs = loadLogs();
    logs.unshift({
      id: `u_${Date.now()}`,
      title,
      priority,
      msg,
      utc: `${new Date().toISOString().slice(11, 16)} UTC`,
      author: auth,
    });

    saveLogs(logs);
    form.reset();
    renderLogs($("logFilter")?.value || "all");
  });

  const clearBtn = $("clearLogBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem(LS_KEY);
      renderLogs($("logFilter")?.value || "all");
    });
  }
}

function bindLogFilter() {
  const sel = $("logFilter");
  if (!sel) return;
  sel.addEventListener("change", (e) => renderLogs(e.target.value));
}

function caesar(str, shift) {
  const a = "abcdefghijklmnopqrstuvwxyz";
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return str.replace(/[a-zA-Z]/g, (ch) => {
    const isUpper = ch === ch.toUpperCase();
    const alpha = isUpper ? A : a;
    const i = alpha.indexOf(ch);
    if (i === -1) return ch;
    const ni = (i + shift + 26) % 26;
    return alpha[ni];
  });
}

function bindTransmission() {
  const encodeBtn = $("txEncodeBtn");
  const decodeBtn = $("txDecodeBtn");
  const input = $("txInput");

  function updateStats() {
    const strength = 60 + Math.floor(Math.random() * 35);
    const loss = 1 + Math.floor(Math.random() * 8);
    $("signalStrength") && ($("signalStrength").textContent = `${strength}%`);
    $("packetLoss") && ($("packetLoss").textContent = `${loss}%`);
  }

  if (encodeBtn && input) {
    encodeBtn.addEventListener("click", () => {
      input.value = caesar(input.value, 7);
      updateStats();
    });
  }

  if (decodeBtn && input) {
    decodeBtn.addEventListener("click", () => {
      input.value = caesar(input.value, -7);
      updateStats();
    });
  }

  updateStats();
  setInterval(updateStats, 2500);
}

function init() {
  if (!document.querySelector('[data-page="missions"]')) return;

  renderTimeline();
  renderLogs("all");
  bindLogFilter();
  bindLogForm();
  bindTransmission();
}

init();
