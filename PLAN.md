# PLAN.md – Website Upgrade Session 6

## 🎯 Projektziel
4 Under-the-Radar Features: Lofi Audio-Visualizer, Blur-Reveal Zitat-Animation, Klick-Sounds (ohne Hover!), Page Transitions.

---

## 🔍 Qualitätskontrolle & Bewertung

### ✅ Genehmigt:
1. **Lofi Audio-Visualizer** → 3 lila CSS-Balken im Stream-Badge UND YouTube Music Badge (pure CSS)
2. **Blur-Reveal Zitat** → Cinematischer `blur → focus` Effekt statt Slide-Up
3. **Page Transitions** → Fade-Out für interne Links (zukunftssicher)
4. **Text-Umbenennung** → "Study Playlist" → "Musik Playlist"

### ⚠️ Teilweise abgelehnt (User zugestimmt):
5. **Micro-Sounds** → NUR Klick-Sound + Erfolgs-Sound. KEIN Hover-Swoosh (UX-Noise)

---

## 📋 Mikro-Aufgaben

### Phase 1: Lofi Audio-Visualizer + Text (CSS + HTML)
- [x] **Task 1.1**: HTML — Audio-Balken in Lofi Stream + YouTube Music Pills eingefügt; "Study Playlist" → "Musik Playlist" umbenannt ✅
- [x] **Task 1.2**: CSS — `@keyframes audio-bounce` Animation + `.audio-bar` + `.audio-bars` Styling hinzugefügt ✅

### Phase 2: Blur-Reveal Zitat-Animation (CSS)
- [x] **Task 2.1**: CSS — Slide-Up durch cinematischen `blur(8px) → blur(0px)` + `scale(0.96 → 1)` Effekt ersetzt ✅

### Phase 3: Klick-Sounds & Erfolgs-Sound (JS)
- [x] **Task 3.1**: JS — Web Audio API mit `playClickSound()` + `playWinSound()` auf alle `.btn-satisfying` Buttons ✅
- [x] **Task 3.2**: snake.js — `playWinSound()` in `_win()` Methode eingebaut ✅

### Phase 4: Page Transition Fade-Out (CSS + JS)
- [x] **Task 4.1**: CSS `body.page-leaving` + JS Event-Listener für same-origin Links mit 400ms Fade-Out ✅

### Phase 5: Dokumentation & Verifikation
- [x] **Task 5.1**: Session-Log aktualisiert mit allen Session 6 Änderungen ✅
- [x] **Task 5.2**: Browser-Verifikation bestanden + Spacing gegen GitHub-Repo gecheckt (identisch) ✅
