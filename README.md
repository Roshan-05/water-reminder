# Water Reminder

A small Windows tray app that reminds you to drink water on a timer. Instead of a plain
notification, a pixel-art avatar of you walks in from the bottom-right of the screen,
turns to face you, drinks, then asks whether you drank water — with "Yes" and "Snooze"
buttons.

## Running in development

```
npm install
npm start
```

No window appears on launch — look for the tray icon (it may be under the hidden-icons
chevron in the Windows taskbar the first time). Right-click it for options, including
"Drink water now" to trigger the popup immediately without waiting for the timer.

Settings (reminder interval, snooze duration) are available from the tray menu and are
saved to `%APPDATA%\water-reminder\config.json`.

## Packaging (for auto-start on login)

Auto-start only works correctly from a packaged build — in dev mode `npm start` runs
`electron.exe` itself, not a dedicated app executable, so login registration has nothing
stable to point at.

```
npm run dist
```

This produces a portable exe under `dist/`. Run it once manually — it will register
itself to start on login. Verify under Task Manager → Startup apps.

## Changing the sprite

Animation frames and timings are defined in `assets/sprite/sprite.config.json`. Swap in
new PNGs and update the file lists/timings there — no code changes needed for new frames
of the same poses. The original uncropped/contact-sheet source images are kept in
`assets/sprite/raw/` for reference.
