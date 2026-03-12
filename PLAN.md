# 🚀 PLAN.md – Website-Optimierung: Refactoring, Performance & Design

## Projektziel
Die bestehende Traubenzuckermeister-Webseite optimieren:
1. Code in separate Dateien aufteilen (CSS → `style.css`, JS → `script.js`)
2. Performance verbessern (Mousemove-Throttling, YouTube Lazy-Loading)
3. Design-Upgrades (Footer, Favicon, will-change Optimierung)
4. Rainbow-Glow & Mobile-Fix

---

## Phase 1: Dateien aufteilen
- [x] **Task 1.1** – CSS extrahieren → `style.css` erstellt (1091 Zeilen) ✅
- [x] **Task 1.2** – JS extrahieren → `script.js` erstellt (383 Zeilen) ✅
- [x] **Task 1.3** – `index.html` aufgeräumt (1777 → 321 Zeilen) ✅

---

## Phase 2: Performance-Optimierungen
- [x] **Task 2.1** – `requestAnimationFrame`-basiertes Throttling für Maus-Events ✅
- [x] **Task 2.2** – YouTube `loading="lazy"` + Video `preload="metadata"` ✅

---

## Phase 3: Design-Upgrades
- [x] **Task 3.1** – Eleganter Footer + Emoji Favicon (🍇) + `will-change` auf `:hover` ✅
- [x] **Task 3.2** – Finaler Browser-Test bestanden ✅

---

## Phase 4: Rainbow-Glow & Mobile-Fix
- [x] **Task 4.1** – `@keyframes rainbow-shift` (8s, linearer 300%-Scroll durch Regenbogen-Gradient) ✅
- [x] **Task 4.2** – `@keyframes rainbow-glow` (6-Stufen text-shadow durch alle Farben) ✅
- [x] **Task 4.3** – `.welcome-title` → Rainbow-Gradient + `clamp(1.3rem, 6vw, 3.5rem)` ✅
- [x] **Task 4.4** – `.section-title` → Rainbow-Gradient + `clamp(1.5rem, 5vw, 2.5rem)` ✅
- [x] **Task 4.5** – Alten `font-size: 2rem` Override bei 600px entfernt (clamp() übernimmt) ✅

---

## Architektur-Entscheidungen
| Entscheidung | Begründung |
|---|---|
| CSS/JS in separate Dateien | Browser-Caching, paralleles Laden, bessere Wartbarkeit |
| RAF-Throttling für mousemove | Reduziert DOM-Updates von 120/s auf 60/s (=1 pro Render-Frame) |
| YouTube `loading="lazy"` | Iframes laden erst beim Scrollen, spart ~2MB beim Seitenaufruf |
| `will-change` nur bei `:hover` | Verhindert permanente GPU-Speicher-Reservierung für alle Karten |
| Emoji Favicon via SVG | Kein extra Datei nötig, funktioniert in allen modernen Browsern |
| Video `preload="metadata"` | Statt 21MB sofort zu laden, nur Metadaten laden |
| `clamp()` statt Media-Query Override | Fluid Typography: skaliert automatisch statt harter Breakpoint |
| `rainbow-shift` 0→300% linear | Endlos-Loop ohne Rücksprung: Gradient rollt immer vorwärts durch |
