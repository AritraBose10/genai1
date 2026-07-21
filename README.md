# Applied Generative AI — Interaction Lab (2D)

Flat 2D Canvas teaching site. No WebGL, no Three.js, no build step, no
dependencies at all — just plain HTML5 Canvas. 8 pages, horizontal scroll.

## Run
```
node serve.js         # then open http://localhost:8080
```
(or `python3 -m http.server 8080`). Use a server — don't double-click the HTML.

## Design
Dark techy dashboard look: soft grid background, neon glow strokes (cyan /
violet / pink / green), rounded card panels, monospace type. No fake 3D —
everything reads clearly at a glance, which matters more for a classroom
board than a hologram effect did.

## Pages
1. **It Makes New Things** — drag seeds into the generator; unique output every time.
2. **Two Ways to Learn** — discriminative (sorts) vs generative (creates) machines.
3. **AI Contains ML Contains DL** — nested rings + drag-to-sort game.
4. **Hand-Built vs Learned** — ML needs feature tools; DL learns its own.
5. **Features, Floor by Floor** — the layer stack: edges → textures → parts → object.
6. **How a Neuron Fires** — toggle inputs, press FIRE, watch the threshold.
7. **The Forward Pass** — full network, signal ripples through the layers.
8. **Gradient Descent** — a ball rolls downhill on a live loss landscape (now a
   true top-down heatmap grid, which reads more clearly than the old 3D tilt).

Every page has a title, a plain-language instruction, and a short
"why it matters" line — all in the same place, same size, on every page.

## Controls
Drag with mouse/finger · throw = drag fast + release · arrows/dots/swipe = navigate ·
Reset Page · Sound toggle · debug FPS = tap top-right corner 5× fast.

## Structure
- `engine.js` — canvas setup, physics, base object, pointer handling, page
  registry, grid/particle background, glow-drawing helpers (panel, glowCircle,
  glowLine, drawText, wrapText)
- `page1.js … page8.js` — one file per page, each calls `LAB.definePage({...})`
- `serve.js` — tiny local server

To add a page: copy a page file, bump the index in index.html's script list.

## Tuning
Physics constants: `PHY` object at the top of `engine.js`.
Colors: `COL` object at the top of `engine.js` — change once, applies everywhere.
Text sizes: passed directly to `L.drawText(...)` calls in each page (in real
CSS pixels — what you set is what you get, no scaling math).
