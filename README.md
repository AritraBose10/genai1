# Applied Generative AI — Interaction Lab

WebGL hologram teaching site. Fully offline. 8 pages, horizontal scroll.

## Run
```
node serve.js         # then open http://localhost:8080
```
(or `python3 -m http.server 8080`). Use a server — don't double-click the HTML.

## Pages
1. **It Makes New Things** — drag seeds into the generator; unique output every time.
2. **Two Ways to Learn** — discriminative (sorts) vs generative (creates) machines.
3. **AI Contains ML Contains DL** — nested rings + drag-to-sort game.
4. **Hand-Built vs Learned** — ML needs feature tools; DL learns its own.
5. **Features, Floor by Floor** — the layer stack: edges → textures → parts → object.
6. **How a Neuron Fires** — toggle inputs, press FIRE, watch the threshold.
7. **The Forward Pass** — full network, signal ripples through the layers.
8. **Gradient Descent** — a ball rolls downhill on a live loss landscape; drag the
   learning-rate handle and watch it crawl, converge, or overshoot; spawn 5 balls
   to see different starting points find different minima.

Every page now carries a short "Why it matters" line connecting the interaction
back to the course.

## Controls
Drag with mouse/finger · throw = drag fast + release · arrows/dots/swipe = navigate ·
Reset Page · Sound toggle · debug FPS = tap top-right corner 5× fast.

## Structure
- `engine.js` — shared core: renderer, bloom, physics, base object, pointers, page
  registry. Idle objects now have a subtle ambient breathing/bob animation.
- `page1.js … page8.js` — one file per page, each calls `LAB.definePage({...})`
- `vendor/` — Three.js r128 + bloom passes (bundled offline)
- `serve.js` — tiny local server

To add a page: copy a page file, bump the page index, add a `<script>` line in index.html.

## Tuning
Physics constants live in the `PHY` object at the top of `engine.js`.
Page 8's loss-function shape is the `h(x,y)` function at the top of `page8.js` —
change the formula to reshape the landscape (more/fewer local dips, deeper bowl).
# genai1 
