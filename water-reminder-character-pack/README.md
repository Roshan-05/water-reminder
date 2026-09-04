# Water Reminder Character Pack

Generated from the supplied pixel-art sheet.

## Included
- `assets/walk-left/01-03.png` — 3 left-facing walking poses
- `assets/walk-right/01-03.png` — 3 right-facing walking poses
- `assets/hold/01.png` — holding bottle
- `assets/drink/01-02.png` — drinking pose (second frame is a held frame)
- `assets/idle/01.png` — idle pose
- `assets/sprite-sheet.png` — all frames on one common 300x520 canvas
- `demo.html` — browser demo of the complete sequence

## Sequence
Right edge -> walk left -> stop -> drink -> idle -> notification ->
"I drank" / "Snooze" -> walk right -> disappear.

## Run the demo
Open `demo.html` in a browser. If the browser blocks local assets, run a tiny
local server from this folder, for example:

  python -m http.server 8000

Then open the local server address in your browser.

## Integrating into Electron
Use the same `assets` paths in your renderer. For the desktop version,
create a transparent, frameless, always-on-top BrowserWindow and position the
character near the right edge. The animation itself is already separated from
the notification logic in `demo.html`.
