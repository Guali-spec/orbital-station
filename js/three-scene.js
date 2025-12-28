// js/three-scene.js
// Three.js scene for dashboard main canvas

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";

import { on } from "./sim.js";
import { isLowPower, prefersReducedMotion } from "./main.js";

let renderer, scene, camera, controls;
let rafId = 0;

function $(id) {
  return document.getElementById(id);
}

function getCanvas() {
  return $("main3d");
}

function setSize() {
  const canvas = getCanvas();
  if (!canvas || !renderer || !camera) return;

  const parent = canvas.parentElement;
  const w = parent.clientWidth;
  const h = parent.clientHeight;

  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function buildScene() {
  scene = new THREE.Scene();

  // Subtle fog like the mock
  scene.fog = new THREE.FogExp2(0x05080d, 0.04);

  camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 200);
  camera.position.set(0, 2.2, 7.5);

  const canvas = getCanvas();
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0); // transparent over UI background

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 4.0;
  controls.maxDistance = 12.0;
  controls.maxPolarAngle = Math.PI * 0.62;

  // Lighting
  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(4, 5, 6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x35d2ff, 0.55);
  fill.position.set(-6, 2, -4);
  scene.add(fill);

  const amb = new THREE.AmbientLight(0x9ec7db, 0.22);
  scene.add(amb);

  // Stars (cheap)
  const starGeo = new THREE.BufferGeometry();
  const starCount = 900;
  const pos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    pos[i * 3 + 0] = (Math.random() - 0.5) * 60;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 2] = -Math.random() * 80;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xbfe8ff, size: 0.03, transparent: true, opacity: 0.6 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Placeholder "station": simple kitbash with primitives (upgrade later with glTF)
  const station = new THREE.Group();
  station.name = "station";

  const metal = new THREE.MeshStandardMaterial({
    color: 0xa9b7c6,
    metalness: 0.7,
    roughness: 0.35,
  });

  const dark = new THREE.MeshStandardMaterial({
    color: 0x233447,
    metalness: 0.3,
    roughness: 0.7,
  });

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 18), metal);
  core.rotation.z = Math.PI / 2;
  station.add(core);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 22), metal);
  hub.rotation.z = Math.PI / 2;
  station.add(hub);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 16, 42), dark);
  ring.rotation.y = Math.PI / 2;
  ring.position.x = 0.8;
  station.add(ring);

  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1a4b66,
    metalness: 0.15,
    roughness: 0.55,
    emissive: 0x0b2030,
    emissiveIntensity: 0.35,
  });

  const panelGeo = new THREE.BoxGeometry(1.3, 0.02, 0.55);
  const panel1 = new THREE.Mesh(panelGeo, solarMat);
  panel1.position.set(-0.8, 0.55, 0);
  station.add(panel1);

  const panel2 = new THREE.Mesh(panelGeo, solarMat);
  panel2.position.set(-0.8, -0.55, 0);
  station.add(panel2);

  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 14), metal);
  arm.rotation.z = Math.PI / 2;
  arm.position.x = -0.2;
  arm.position.y = 0.55;
  station.add(arm);

  const arm2 = arm.clone();
  arm2.position.y = -0.55;
  station.add(arm2);

  station.rotation.y = -0.35;
  station.rotation.x = 0.18;

  scene.add(station);

  setSize();
  window.addEventListener("resize", setSize);

  // Bind UI buttons if present
  bindToolbar();
}

function bindToolbar() {
  const zoomInBtn = $("zoomInBtn");
  const zoomOutBtn = $("zoomOutBtn");
  const resetViewBtn = $("resetViewBtn");

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      controls.dollyIn(1.12);
      controls.update();
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      controls.dollyOut(1.12);
      controls.update();
    });
  }
  if (resetViewBtn) {
    resetViewBtn.addEventListener("click", () => {
      controls.reset();
      camera.position.set(0, 2.2, 7.5);
      controls.update();
    });
  }
}

function renderLoop() {
  const lp = isLowPower() || prefersReducedMotion();
  const station = scene.getObjectByName("station");

  if (station) {
    // subtle rotation like mock
    station.rotation.y += lp ? 0.0015 : 0.0032;
  }

  controls.update();
  renderer.render(scene, camera);

  rafId = requestAnimationFrame(renderLoop);
}

function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

function startLoop() {
  stopLoop();
  renderLoop();
}

function initThreeIfDashboard() {
  const canvas = getCanvas();
  if (!canvas) return; // only on dashboard

  buildScene();
  startLoop();

  // React to low power toggles (adjust pixel ratio)
  on("lowpower", () => {
    const ratio = isLowPower() ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(ratio);
  });
}

initThreeIfDashboard();
