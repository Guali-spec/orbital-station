# 🛰️ ORBITAL STATION — Mission Portal

> A project born somewhere between insomnia and orbit.

---

## 🌌 Une nuit, une idée

Il est **2h du matin**,  
**dimanche 28 décembre 2025**.

Le silence est total, le sommeil introuvable.  
Plutôt que de forcer le repos, j’ai choisi de **laisser l’esprit dériver**.

C’est dans ce moment suspendu — entre fatigue et curiosité — qu’est née une idée simple :  
**et si je concevais une station spatiale ?**

Non pas une vraie, évidemment,  
mais une **interface**,  
un **tableau de bord**,  
un **lieu fictif** où le code devient un moyen d’exploration.

---

## 🚀 Le projet

**ORBITAL STATION — Mission Portal** est un mini-site web qui simule l’interface de contrôle d’une station spatiale imaginaire.

Un espace numérique inspiré :
- des centres de contrôle spatiaux,
- des interfaces scientifiques,
- et de la science-fiction réaliste.

Ce projet n’a pas été pensé pour être rentable, optimisé ou livré.  
Il a été **conçu pour exister**, simplement.

---

## 🧠 Intention

- Créer sans contrainte extérieure
- Explorer l’UI scientifique
- Manipuler la 3D sur le web
- Simuler des systèmes vivants
- Construire une ambiance, pas un produit

---

## 🛰️ Ce que l’on trouve à bord

- Un **dashboard orbital** avec données simulées
- Des **systèmes vitaux** à surveiller et diagnostiquer
- Un **équipage** et des modules de station
- Un **journal de mission**
- Une **scène 3D interactive**, lente et silencieuse

Tout est faux.  
Mais tout est cohérent.

---

## 🧩 Choix techniques

- HTML, CSS, JavaScript
- Three.js pour la 3D
- Aucune dépendance inutile
- Aucune base de données
- Aucune précipitation

Les données évoluent doucement.  
Les animations respirent.  
L’interface ne crie jamais.


🌙 Note finale

Ce projet est né d’une nuit blanche.
Il n’essaie pas de résoudre un problème.
Il documente simplement un moment.

Parfois, coder n’est pas une solution.
C’est une orbite temporaire.

## 🗂️ Structure du projet

orbital-station/
│
├── index.html # Dashboard principal (3D + KPI)
├── systems.html # Systèmes & diagnostics
├── crew.html # Équipage & modules
├── missions.html # Missions & journal de bord
│
├── css/
│ └── style.css # Thème global & composants UI
│
├── js/
│ ├── main.js # Navigation, thèmes, utilitaires
│ ├── sim.js # Simulation des données
│ ├── three-scene.js # Scène 3D (Three.js)
│ ├── systems.js
│ ├── crew.js
│ └── missions.js
│
├── assets/
│ └── (models, textures, icons)
│
└── README.md


---

## 🛰️ Pages & fonctionnalités

### 1. Dashboard
- Vue d’ensemble de la station
- KPI animés (altitude, vitesse, oxygène, énergie)
- Scène 3D interactive (rotation, zoom)
- Modes Day/Night, Red Alert, Low Power

### 2. Systems & Controls
- États des systèmes vitaux
- Diagnostics simulés
- Console de logs en temps réel
- Incidents rares générés automatiquement

### 3. Crew & Modules
- Équipage avec rôles et shifts
- Plan des modules de la station
- Modals interactifs avec checklists

### 4. Missions & Logbook
- Timeline des missions
- Journal de bord persistant (localStorage)
- Transmission chiffrée (easter egg)

---

## 🧩 Technologies utilisées

- **HTML5**
- **CSS3** (variables, animations, responsive)
- **JavaScript (ES6+)**
- **Three.js** (via CDN, pour la 3D)
- **localStorage** (persistance locale)

Aucun framework, aucun backend.

---

## ⚙️ Lancer le projet

### Option 1 — Simple
Ouvrir `index.html` directement dans un navigateur moderne.

### Option 2 — Recommandé (modules JS)
```bash
python -m http.server
```
Puis ouvrir :
```bash
http://localhost:8000
````





