# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pixel-art water reminder with two clients sharing one Firebase backend:

- **Desktop app** (repo root) — Electron tray app for Windows. A pixel character walks in
  from the bottom-right, drinks, then asks "Did you drink water?" with Yes/Snooze buttons.
- **Android app** (`android-app/`) — Capacitor companion app that fires local notifications
  on the same schedule.

Both clients read/write the same Firestore `users/{uid}` document, so either device can
change settings (interval, pause state, today's count) and the other picks it up via a
live snapshot listener.

## Commands

Desktop app (run from repo root):
```
npm install
npm start              # launch in dev (no window on launch — look for the tray icon)
npm run test:smoke     # scripts/smoke-test.js: launches the app with WR_TEST_AUTOFIRE=1,
                        # fires a reminder after 1s, quits after 7s, fails on any
                        # Uncaught/TypeError/ReferenceError/ENOENT in the output
npm run dist           # electron-builder portable exe -> dist/ (needed to test auto-launch)
npm run build-sprites  # scripts/extract-sprite-sheet.js: regenerate assets/sprite/* frames
                        # from raw-assets/ or water-reminder-character-pack/
```

There is no automated unit test suite — `test:smoke` (a real Electron process boot) is the
only check. There is no lint script configured.

Android app (run from `android-app/`):
```
npm install
npm run build   # esbuild www-src/js/*.js -> www/js, copies *.html, syncs assets (build.js)
npm run sync    # build + `cap sync android`
npm run open    # open the Android project in Android Studio
npm run run     # sync + `cap run android`
```
`android-app/www/` is build output (gitignored) — always edit under `www-src/`, never `www/`.

## Architecture

### Desktop (`src/main/`, `src/preload/`, `src/renderer/`, `src/shared/`)

- `main/index.js` — entry point. Acquires the single-instance lock, then wires up tray,
  scheduler, auto-launch, and a cached Firebase sign-in before starting the scheduler.
  `WR_TEST_NO_FIREBASE=1` skips Firebase sign-in; `WR_TEST_AUTOFIRE=1` is used by the smoke test.
- `main/scheduler.js` — the timer state machine. Tracks the single pending reminder timeout,
  checks `powerMonitor.getSystemIdleTime()` before firing (reschedules instead of popping up
  if the user is idle), and exposes the pause/snooze/drink transitions. Reacts to system
  suspend/resume. `onRemoteStateChange()` is the hook Firestore updates call to re-arm the
  timer after a remote change (e.g. interval edited from the Android app).
  Modules `require()` each other lazily inside functions (`getPopupWindow()`, `getTray()`,
  etc.) to avoid circular-require issues between scheduler/tray/popupWindow — follow that
  pattern rather than hoisting requires to the top when adding cross-module calls.
- `main/settingsStore.js` — local source of truth via `electron-store`, mirrored to Firestore.
  `set()` always writes local-first, then pushes to Firebase if signed in. Sync note: for
  `todayCount` it pushes a `todayCountDelta` (translated to a Firestore `increment()`) instead
  of the raw count, unless the date rolled over — this avoids clobbering a count the other
  device just incremented. `handleRemoteUpdate()` is the Firestore `onSnapshot` callback; it
  applies fields locally then calls `scheduler.onRemoteStateChange()` and `tray.refresh()`.
- `main/firebase.js` — thin wrapper around the Firebase JS SDK (auth + Firestore) for the
  main process. `pushUserState`/`subscribeToUserState` read/write `users/{uid}`, stamping
  `updatedAt`/`lastWriter`. Snapshot listeners ignore events where `hasPendingWrites` is true,
  so a device's own write doesn't loop back as a "remote" update.
- `main/authStore.js` — persists email/password via `electron-store` + `safeStorage` (OS
  keychain-backed encryption) so the tray app can silently re-sign-in on launch. If
  `safeStorage.isEncryptionAvailable()` is false, credentials are neither saved nor read.
- `main/popupWindow.js` — creates the frameless, transparent, always-on-top, click-through-ish
  reminder window (and a separate full-screen transparent confetti overlay window). Registers
  its IPC handlers (`popup:*`) once (`handlersRegistered` guard). Position is bottom-right of
  whichever display currently has the cursor.
- `main/tray.js` / `main/settingsWindow.js` — tray menu (pause/resume/settings/quit) and the
  settings window's IPC handlers (`settings:*`, `auth:*`).
- `src/preload/*.js` — `contextBridge` APIs (`window.waterReminder`, `window.settingsApi`);
  `contextIsolation: true` / `nodeIntegration: false` everywhere, so any new main<->renderer
  call needs a matching preload exposure and `ipcMain` handler.
- `src/shared/reminderAnimation.js` — the animation state machine driving the popup: walk in
  -> hold -> drink -> idle -> speech bubble -> (Yes: confetti + walk out) or (Snooze: walk
  out). Pure DOM/timing logic, framework-free, shared conceptually with the sprite config
  below. `src/renderer/popup/main.js` wires this to the Electron IPC calls.
- `assets/sprite/sprite.config.json` — all animation timing/geometry (frame lists per
  direction, `displayHeightPx`, walk distance/duration, per-phase delays) is data-driven from
  here; `reminderAnimation.js` never hardcodes frame paths or durations.

### Android (`android-app/www-src/js/`)

- `dataLayer.js` — same Firestore schema/contract as desktop's `firebase.js` +
  `settingsStore.js` combined (auth, `subscribeToUserState`, `pushUserState` with the same
  `todayCountDelta` merge trick), but `lastWriter: 'android'` instead of `'desktop'`. Keep the
  two in sync when changing the Firestore document shape.
- `scheduler.js` — mirrors desktop's pause/pausedUntil/interval logic but schedules a
  `@capacitor/local-notifications` alarm instead of an in-process `setTimeout`. Debounces
  redundant re-arms via a `sessionStorage` timestamp (`SKIP_ARM_WINDOW_MS`), since Firestore
  snapshot callbacks can fire more often than the schedule actually needs to change.
- `main.js` / `auth.js` / `reminderScreen.js` — app screens/entry; built by `build.js`
  (esbuild, ESM, browser target) into `www/`, which is what Capacitor packages into the APK.

### Cross-cutting

Any change to the settings shape (new field, renamed field, different pause semantics) has
four call sites to keep aligned: `src/main/settingsStore.js` (defaults + `get`/`set`),
`src/main/firebase.js` + `android-app/www-src/js/dataLayer.js` (Firestore push/subscribe),
and `android-app/www-src/js/scheduler.js` / `src/main/scheduler.js` (how the new field
affects arming). The Firestore document is the shared contract between the two clients —
there's no schema validation, so a typo in a field name silently desyncs one client from
the other.
