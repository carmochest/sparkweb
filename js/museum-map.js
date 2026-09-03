/* Spark Play Museum — interactive 3D map  (MOCK LAYOUT)
   A little paper-cut city built from CSS 3D boxes: Monument Valley geometry
   (tiers, towers, arches, flags, stairs) with an Eric Carle painted-paper
   finish (mottled colour, grain, hand-cut wobbly edges). Hover lifts a
   building, click selects it (small card → "Look inside"), drag spins the
   island. ZONES below is placeholder data — swap in the real plan later. */
(function () {
  const root = document.querySelector("[data-museum-map]");
  if (!root) return;
  const section = root.closest("section, .stage-wrap") || document;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  // x/y/w/h in grid units, z = height px, c = colour group (legend), p = paint colour, roof = feature
  // Two districts: The Gallery (indoor studios, plum tints) and The Garden (outdoor, greens).
  const DISTRICTS = { z1: "The Gallery", z2: "The Garden" };
  const ZONES = [
    // ---- The Gallery (x 0–4) ----
    { id: "drawing",   name: "Drawing Room",        x: 0, y: 0, w: 2, h: 2, z: 46, c: "z1", p: "mustard", roof: "pencil", info: "Big paper, big crayons, big ideas. Open-ended mark-making for all ages.", ages: "1–10" },
    { id: "art",       name: "Art Studio",          x: 2, y: 0, w: 2, h: 2, z: 54, c: "z1", p: "terra",   roof: "tiers",  info: "Paint, collage and mixed media with our resident artist. Aprons provided.", ages: "3–10" },
    { id: "looksee",   name: "Look & See",          x: 4, y: 0, w: 1, h: 2, z: 40, c: "z1", p: "sky",     roof: "dome",   info: "Light, shadow, mirrors and lenses — a gallery that changes as you move.", ages: "2–10" },
    { id: "colouring", name: "Colouring Wall",      x: 0, y: 2, w: 1, h: 2, z: 62, c: "z1", p: "sage",    roof: "flag",   info: "A wall-sized colouring page that resets every week.", ages: "1–8" },
    { id: "shape",     name: "Shape Lab",           x: 1, y: 2, w: 2, h: 1, z: 40, c: "z1", p: "lilac",   roof: "blocks", info: "Magnetic tiles, foam geometry and floor puzzles.", ages: "2–7" },
    { id: "pottery",   name: "Pottery Studio",      x: 3, y: 2, w: 2, h: 1, z: 48, c: "z1", p: "blush",   roof: "dome",   info: "Clay wheels sized for small hands. Pieces are fired and collected later.", ages: "4–10" },
    { id: "printing",  name: "Printing Lab",        x: 1, y: 3, w: 2, h: 1, z: 40, c: "z1", p: "sky2",    roof: "flag",   info: "Stamps, rollers, screens and ink. Take your print home.", ages: "3–10" },
    { id: "makers",    name: "Builders & Makers",   x: 3, y: 3, w: 2, h: 1, z: 44, c: "z1", p: "mustard2", roof: "tiers", info: "Real tools, real wood, real cardboard — with a facilitator alongside.", ages: "5–10" },
    { id: "workshop",  name: "Builders' Workshop",  x: 0, y: 4, w: 2, h: 1, z: 56, c: "z1", p: "terra2",  roof: "stairs", info: "Blocks, ramps and gears. Build tall, build wide, knock it down.", ages: "3–10" },
    { id: "drop",      name: "The Drop Tower",      x: 2, y: 4, w: 1, h: 1, z: 84, c: "z1", p: "lilac2",  roof: "tiers",  info: "Three storeys of ramps, chutes and drops. Send a ball to the top and race it down.", ages: "3–10" },
    { id: "play",      name: "Play Studio",         x: 3, y: 4, w: 2, h: 1, z: 48, c: "z1", p: "blush2",  roof: "blocks", info: "Dress-up, puppets and a little stage — a show on the hour.", ages: "2–8" },
    { id: "story",     name: "Story Studio",        x: 3, y: 5, w: 2, h: 1, z: 34, c: "z1", p: "sand2",   roof: "awning", info: "Picture books, cushions and a storyteller three times a day.", ages: "1–8" },
    { id: "hello",     name: "Hello & Goodbye",     x: 0, y: 5, w: 3, h: 1, z: 20, c: "z1", p: "sand",    roof: "arch",   info: "Check in, stroller parking, lockers and the welcome desk. Play Facilitators start here — and wave you off at the end." },
    // ---- The Garden (x 5–8) ----
    { id: "playscape", name: "Playscape",           x: 5, y: 0, w: 2, h: 2, z: 64, c: "z2", p: "moss",    roof: "tower",  info: "The climbing, sliding, hiding heart of the garden. Socks on!", ages: "1–8" },
    { id: "birds",     name: "Bird Watch",          x: 7, y: 0, w: 2, h: 1, z: 44, c: "z2", p: "leaf2",   roof: "stairs", info: "A raised hide with binoculars and a bird-call board. Quiet feet, please.", ages: "3–10" },
    { id: "biomes",    name: "Desert & Rainforest", x: 7, y: 1, w: 2, h: 2, z: 30, c: "z2", p: "leaf",    roof: "dome",   info: "Two climates side by side: hot sand and cacti, then mist, moss and dripping leaves.", ages: "2–10" },
    { id: "water",     name: "Water Lab",           x: 5, y: 2, w: 2, h: 1, z: 22, c: "z2", p: "mint",    roof: "pool",   info: "Pumps, dams and boats. Waterproof smocks at the door.", ages: "1–7" },
    { id: "waterworks", name: "Water Works",        x: 5, y: 3, w: 2, h: 1, z: 30, c: "z2", p: "leaf2",   roof: "blocks", info: "Sluices, a wheel to turn and a pump to work — move water uphill and see where it goes.", ages: "3–10" },
    { id: "sound",     name: "Sight & Sound Lab",   x: 7, y: 3, w: 2, h: 1, z: 40, c: "z2", p: "moss",    roof: "blocks", info: "Tubes, chimes, echoes and a whisper wall.", ages: "2–10" },
    { id: "senses",    name: "Super Senses",        x: 5, y: 4, w: 2, h: 1, z: 34, c: "z2", p: "mint",    roof: "dome",   info: "Barefoot paths, scent boxes and textures to touch — a garden for your whole body.", ages: "1–10" },
    { id: "horns",     name: "Whisper Horns",       x: 7, y: 4, w: 2, h: 1, z: 28, c: "z2", p: "leaf",    roof: "horns",  info: "Giant horns across the lawn carry a whisper from one end to the other.", ages: "2–10" },
  ];
  const PAINT = { // clean flat palette (plum tints, blush, sand) — the UI plum stays the boss
    mustard: "#D6C6D3", mustard2: "#CBB8C8", terra: "#B49CBE", terra2: "#A48AA0", sky: "#F0D6D0", sky2: "#E6C4BC",
    sage: "#D6C6D3", sage2: "#A48AA0", lilac: "#C9B6C6", lilac2: "#BBA5B8", blush: "#F0D6D0", blush2: "#E9CFC8", sand: "#F1E8D6", sand2: "#E7DBC4",
    accent: "#F06051", tree: "#B9C9A6", trunk: "#A88C7A",
    leaf: "#D3DDBF", leaf2: "#C2D0A8", moss: "#ACBF93", mint: "#DDE6D0", lawn: "#E4EAD3",
  };
  const PHOTOS = {
    drawing: ["drawings-wall.jpg", "painted-hand.jpg"], art: ["painted-hand.jpg", "crafts.jpg"], looksee: ["plasma.jpg", "dino.jpg"],
    colouring: ["drawings-wall.jpg", "crafts.jpg"], shape: ["blocks.jpg", "hero-rainbow-wall.jpg"], pottery: ["painted-hand.jpg", "crafts.jpg"],
    printing: ["painted-hand.jpg", "drawings-wall.jpg"], makers: ["crafts.jpg", "blocks.jpg"], workshop: ["hero-rainbow-wall.jpg", "blocks.jpg"],
    drop: ["blocks.jpg", "hero-rainbow-wall.jpg"], play: ["party-table.jpg", "balloons.jpg"], story: ["crafts.jpg"], hello: ["blocks.jpg"],
    playscape: ["water-play.jpg", "hero-rainbow-wall.jpg"], birds: ["dino.jpg"], biomes: ["dino.jpg", "plasma.jpg"], water: ["water-play.jpg", "plasma.jpg"],
    waterworks: ["water-play.jpg"], sound: ["plasma.jpg", "water-play.jpg"], senses: ["painted-hand.jpg", "water-play.jpg"], horns: ["plasma.jpg"],
  };
  const COLS = 9, ROWS = 6, U = 84, GAP = 22;
  const floor = root.querySelector(".mm-floor"), panel = root.querySelector(".mm-panel"), tip = root.querySelector(".mm-tip");
  const FW = COLS * U, FH = ROWS * U;
  floor.style.width = FW + "px"; floor.style.height = FH + "px"; floor.style.marginLeft = -FW / 2 + "px";

  // ---- helpers ----
  const rnd = (a, b) => a + Math.random() * (b - a);
  const el = (cls, style, html) => { const e = document.createElement("span"); e.className = cls; if (style) e.style.cssText = style; if (html) e.innerHTML = html; return e; };
  // hand-cut edge: a polygon that wobbles a few px around a rectangle
  function cut(w, h, amp) {
    const pts = []; const n = 4;
    const edge = (x0, y0, x1, y1) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t + rnd(-amp, amp), y0 + (y1 - y0) * t + rnd(-amp, amp)]); } };
    edge(0, 0, w, 0); edge(w, 0, w, h); edge(w, h, 0, h); edge(0, h, 0, 0);
    return "polygon(" + pts.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(",") + ")";
  }
  /* A painted box: top + 4 walls, all with paper texture. (w,h footprint px, z height px) */
  function box(w, h, z, color, extra) {
    const b = el("mm-box" + (extra ? " " + extra : ""), `--w:${w}px;--h:${h}px;--z:${z}px;--c:${color}`);
    b.appendChild(el("mm-face mm-top"));
    b.appendChild(el("mm-face mm-wall mm-wall--s"));
    b.appendChild(el("mm-face mm-wall mm-wall--e"));
    b.appendChild(el("mm-face mm-wall mm-wall--n"));
    b.appendChild(el("mm-face mm-wall mm-wall--w"));
    return b;
  }
  const place = (node, x, y, z) => { node.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`; return node; };

  /* Roof features (Monument Valley bits), positioned on top of a building of size w×h at height z */
  function roof(kind, w, h, z, color) {
    const g = el("mm-roof");
    const cx = w / 2, cy = h / 2;
    switch (kind) {
      case "tiers":
        g.appendChild(place(box(w * 0.62, h * 0.62, 16, color), cx - w * 0.31, cy - h * 0.31, z));
        g.appendChild(place(box(w * 0.34, h * 0.34, 14, color), cx - w * 0.17, cy - h * 0.17, z + 16));
        break;
      case "tower":
        g.appendChild(place(box(34, 34, 60, color), w - 52, 14, z));
        g.appendChild(place(el("mm-cone", `--c:${PAINT.accent}`), w - 52, 14, z + 60));
        g.appendChild(place(el("mm-slide", `--c:${PAINT.accent}`), 14, h * 0.55, z));
        g.appendChild(place(el("mm-flag mm-flag--sm", `--c:${PAINT.accent}`), w - 36, 30, z + 78));
        break;
      case "pencil":
        g.appendChild(place(el("mm-crayon", `--c:${PAINT.accent}`), cx - 14, cy - 14, z));
        break;
      case "dome":
        [0.44, 0.34, 0.24, 0.13].forEach((r, i) => g.appendChild(place(el("mm-disc", `--r:${Math.min(w, h) * r}px;--c:${color}`), cx, cy, z + i * 9)));
        break;
      case "stairs":
        for (let i = 0; i < 4; i++) g.appendChild(place(box(18, 18, 10, color), w - 26, 10 + i * 16, z - 40 + i * 12));
        g.appendChild(place(box(w * 0.5, h * 0.5, 12, color), 10, 10, z));
        break;
      case "blocks":
        [[0.15, 0.2, PAINT.accent], [0.55, 0.3, PAINT.terra2], [0.35, 0.62, PAINT.sand2]].forEach(([fx, fy, c]) => g.appendChild(place(box(16, 16, 16, c), w * fx, h * fy, z)));
        break;
      case "flag":
        g.appendChild(place(el("mm-flag", `--c:${PAINT.accent}`), cx - 2, cy - 2, z));
        break;
      case "arch":
        g.appendChild(place(box(14, 30, 46, color), w * 0.35, cy - 15, z));
        g.appendChild(place(box(14, 30, 46, color), w * 0.65 - 14, cy - 15, z));
        g.appendChild(place(box(w * 0.3 + 14, 30, 12, color), w * 0.35, cy - 15, z + 46));
        g.appendChild(place(el("mm-flag mm-flag--sm", `--c:${PAINT.accent}`), w * 0.5 - 2, cy - 2, z + 58));
        break;
      case "pool":
        g.appendChild(place(el("mm-pool", `--w:${w - 30}px;--h:${h - 24}px`), 15, 12, z + 1));
        break;
      case "horns":
        [[10, 10], [w - 28, h - 28]].forEach(([x, y], i) => {
          g.appendChild(place(box(18, 18, 12, color), x, y, z));
          g.appendChild(place(el("mm-cone mm-cone--sm", `--c:${i ? PAINT.accent : PAINT.terra2}`), x, y, z + 12));
        });
        break;
      case "awning":
        g.appendChild(place(el("mm-awning", `--w:${w - 24}px`), 12, h - 18, z + 1));
        break;
    }
    return g;
  }

  // ---- island: paper ground, paths, trees, a wandering visitor ----
  floor.appendChild(el("mm-ground-shadow"));
  floor.appendChild(el("mm-ground-base"));
  const ground = el("mm-ground"); floor.appendChild(ground);
  floor.appendChild(place(el("mm-lawn", `--w:${U * 4 + 10}px;--h:${FH + 10}px;--c:${PAINT.lawn}`), U * 5 - 5, -5, 0.4));
  const sign = (txt, x, y) => el("mm-district", `transform: translate3d(${x}px, ${y}px, 0px) rotateZ(var(--rz, 32deg)) rotateX(calc(-1 * var(--rx, 58deg)))`, `<i>${txt}</i>`);
  floor.appendChild(sign("The Gallery", -34, FH * 0.5));
  floor.appendChild(sign("The Garden", FW + 34, FH * 0.5));
  // streets along the grid, plus one curvy footpath for the visitor
  const streets = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  streets.setAttribute("class", "mm-streets"); streets.setAttribute("viewBox", `0 0 ${FW} ${FH}`);
  let sd = "";
  for (let i = 1; i < COLS; i++) sd += `M${i * U} -30 V${FH + 30} `;
  for (let j = 1; j < ROWS; j++) sd += `M-30 ${j * U} H${FW + 30} `;
  streets.innerHTML = `<path d="${sd}"/>`;
  floor.appendChild(streets);
  const P1 = `M${U * 3} ${FH + 6} C ${U * 3} ${U * 3.6}, ${U * 3} ${U * 2.6}, ${U * 3.4} ${U * 2.2} S ${U * 5} ${U * 2.4}, ${U * 5} ${U * 1.6} S ${U * 5} ${U * 0.4}, ${U * 5} -10`;
  const paths = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  paths.setAttribute("class", "mm-paths"); paths.setAttribute("viewBox", `0 0 ${FW} ${FH}`);
  paths.innerHTML = `<path d="${P1}"/><path d="M${U * 5} ${FH - 8} C ${U * 5.6} ${U * 5.2}, ${U * 6.6} ${U * 5.8}, ${U * 7.4} ${U * 5.3} S ${U * 8.6} ${U * 5.1}, ${FW + 10} ${U * 5.4}"/><path d="M${U * 7} ${U * 3} C ${U * 7} ${U * 3.6}, ${U * 6.4} ${U * 4.2}, ${U * 7} ${U * 5.2}"/>`;
  floor.appendChild(paths);
  [[U * 5.35, U * 5.55], [U * 6.15, U * 5.3], [U * 6.9, U * 5.65], [U * 7.75, U * 5.3], [U * 8.55, U * 5.6], [U * 8.6, U * 2.95], [U * 6.95, U * 2.9], [U * 2.6, U * 5.85]].forEach(([x, y], i) => {
    const t = el("mm-tree" + (i % 2 ? " mm-tree--round" : ""), `--c:${PAINT.tree};--s:${rnd(0.8, 1.15).toFixed(2)}`);
    t.appendChild(el("mm-tree-plane mm-tree-plane--a")); t.appendChild(el("mm-tree-plane mm-tree-plane--b"));
    floor.appendChild(place(t, x, y, 0));
  });
  const visitor = el("mm-visitor", `offset-path: path("${P1}")`); floor.appendChild(visitor);

  // ---- buildings ----
  const blocks = ZONES.map((z, zi) => {
    const w = z.w * U - GAP, h = z.h * U - GAP, color = PAINT[z.p];
    const b = document.createElement("button");
    b.type = "button"; b.className = "mm-block mm-" + z.c; b.dataset.id = z.id; b.setAttribute("aria-label", z.name);
    b.style.cssText = `--x:${z.x * U + GAP / 2}px;--y:${z.y * U + GAP / 2}px;--w:${w}px;--h:${h}px;--z:${z.z}px;--c:${color}`;
    b.appendChild(el("mm-shadow"));
    b.appendChild(box(w, h, z.z, color, "mm-body"));
    b.appendChild(roof(z.roof, w, h, z.z, color));
    const lab = el("mm-label", `transform: translate3d(${w / 2}px, ${h / 2}px, ${z.z + 2}px) rotateZ(var(--rz, 32deg)) rotateX(calc(-1 * var(--rx, 58deg)))`, `<i>${z.name}</i>`);
    lab.style.setProperty("--lift", (8 + ((z.x + z.y) % 3) * 9) + "px");
    b.appendChild(lab);
    floor.appendChild(b);
    b.addEventListener("click", () => select(z, b));
    b.addEventListener("pointerenter", (e) => showTip(z, e));
    b.addEventListener("pointermove", (e) => moveTip(e));
    b.addEventListener("pointerleave", hideTip);
    return b;
  });

  function showTip(z, e) { if (coarse) return; tip.textContent = z.name + (z.ages ? " · ages " + z.ages : ""); tip.hidden = false; moveTip(e); }
  function moveTip(e) { const r = root.getBoundingClientRect(); tip.style.left = e.clientX - r.left + 14 + "px"; tip.style.top = e.clientY - r.top - 10 + "px"; }
  function hideTip() { tip.hidden = true; }

  let selected = null;
  function deselect() { selected = null; blocks.forEach((x) => x.classList.remove("is-selected")); panel.classList.remove("is-live"); panel.hidden = true; }
  function select(z, b) {
    if (selected === z) { deselect(); return; }
    selected = z;
    blocks.forEach((x) => x.classList.toggle("is-selected", x === b));
    panel.innerHTML = `<span class="tag">${DISTRICTS[z.c]}${z.ages ? " · ages " + z.ages : ""}</span><h3>${z.name}</h3><p>${z.info}</p><p><button type="button" class="btn btn--small btn--coral" data-look-inside>Look inside</button></p>`;
    panel.hidden = false; panel.classList.add("is-live");
    panel.querySelector("[data-look-inside]").addEventListener("click", () => lookInside(z));
  }
  root.querySelector(".mm-stage").addEventListener("click", (e) => { if (!e.target.closest(".mm-block, .mm-panel, .mm-ctl, .mm-chip, .wx-card")) deselect(); });

  function lookInside(z) {
    const sheet = document.getElementById("sheet-zone"); if (!sheet) return;
    const pics = (PHOTOS[z.id] || []).map((f) => `<img src="assets/photos/${f}" alt="">`).join("");
    sheet.querySelector(".sheet-head h2").textContent = z.name;
    sheet.querySelector(".sheet-body").innerHTML = `
      ${pics ? `<div class="zone-pics">${pics}</div>` : ""}
      <p class="zone-meta"><span class="tag">${DISTRICTS[z.c]}${z.ages ? " · ages " + z.ages : ""}</span></p>
      <p class="lede">${z.info}</p>
      <div class="zone-facts">
        <div><strong>Best for</strong><span>${z.ages ? "Ages " + z.ages : "Everyone"}</span></div>
        <div><strong>Time to allow</strong><span>${z.ages ? "30–45 min" : "As needed"}</span></div>
        <div><strong>Facilitator</strong><span>${z.ages ? "Always nearby" : "Front desk"}</span></div>
      </div>
      <h3>What happens here</h3>
      <ul class="prog-list"><li>Open-ended materials, no right answers</li><li>Adults play alongside — there's a seat for you too</li><li>Included with every Day Pass and membership</li></ul>
      <div class="panel-tickets"><div><strong>Ready to visit?</strong><span>Day passes from 450 THB · memberships available</span></div><a class="btn btn--coral btn--small" href="tickets.html" data-sheet="tickets">Tickets</a></div>
      <p class="small muted">Photos are placeholders until the real zones are photographed.</p>`;
    if (window.SparkApp) window.SparkApp.openSheet("zone");
  }

  // ---- rotation ----
  let rotZ = -32, rotX = 58, dragging = false, sx = 0, sy = 0, rz0 = 0, rx0 = 0;
  const stage = root.querySelector(".mm-stage");
  const applyRot = () => { floor.style.transform = `rotateX(${rotX}deg) rotateZ(${rotZ}deg)`; root.style.setProperty("--rz", -rotZ + "deg"); root.style.setProperty("--rx", rotX + "deg"); };
  applyRot();
  // fit: scale the island to whatever stage size we have (phones, tablets, desktops)
  const fit = () => {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const s = Math.min(1.06, (sw - 24) / (FW * 1.28), (sh - (sw < 900 ? 250 : 300)) / (FH * 1.1));
    root.style.setProperty("--mm-fit", Math.max(0.22, s).toFixed(3));
  };
  fit(); window.addEventListener("resize", fit);
  // ---- zoom & pan: pinch on touch, +/- buttons, ctrl/⌘ + wheel; double-tap or Reset to clear ----
  let zoom = 1, panX = 0, panY = 0, pinch = null, lastTap = 0;
  const clampZ = (z) => Math.min(2.8, Math.max(0.6, z));
  const applyZoom = () => { root.style.setProperty("--mm-zoom", zoom.toFixed(3)); root.style.setProperty("--mm-pan-x", panX.toFixed(1) + "px"); root.style.setProperty("--mm-pan-y", panY.toFixed(1) + "px"); };
  const resetZoom = () => { zoom = 1; panX = 0; panY = 0; applyZoom(); };
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  stage.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) { const [a, b] = e.touches; pinch = { d: dist(a, b), z: zoom, mx: (a.clientX + b.clientX) / 2, my: (a.clientY + b.clientY) / 2, px: panX, py: panY }; stage.classList.add("is-pinching"); e.preventDefault(); return; }
    if (e.touches.length === 1 && !e.target.closest(".mm-block, .mm-panel, .mm-ctl, .mm-chip, .wx-card, button, a")) { const now = Date.now(); if (now - lastTap < 320) { resetZoom(); e.preventDefault(); } lastTap = now; }
  }, { passive: false });
  stage.addEventListener("touchmove", (e) => {
    if (!pinch || e.touches.length !== 2) return; e.preventDefault();
    const [a, b] = e.touches; zoom = clampZ(pinch.z * dist(a, b) / pinch.d);
    panX = pinch.px + ((a.clientX + b.clientX) / 2 - pinch.mx); panY = pinch.py + ((a.clientY + b.clientY) / 2 - pinch.my); applyZoom();
  }, { passive: false });
  stage.addEventListener("touchend", (e) => { if (e.touches.length < 2) { pinch = null; stage.classList.remove("is-pinching"); } });
  stage.addEventListener("wheel", (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoom = clampZ(zoom * (e.deltaY < 0 ? 1.08 : 0.92)); applyZoom(); }, { passive: false });
  stage.addEventListener("pointerdown", (e) => { if (coarse) return; if (e.target.closest(".mm-block, .mm-panel, .mm-ctl, .mm-chip, .stage-menu, .wx-card, button, a")) return; dragging = true; sx = e.clientX; sy = e.clientY; rz0 = rotZ; rx0 = rotX; stage.setPointerCapture(e.pointerId); stage.classList.add("is-dragging"); });
  stage.addEventListener("pointermove", (e) => { if (!dragging) return; rotZ = rz0 + (e.clientX - sx) * 0.4; rotX = Math.max(30, Math.min(75, rx0 - (e.clientY - sy) * 0.25)); applyRot(); });
  const stop = () => { dragging = false; stage.classList.remove("is-dragging"); };
  stage.addEventListener("pointerup", stop); stage.addEventListener("pointercancel", stop);
  const q = (s) => section.querySelector(s);
  if (q("[data-rot-l]")) q("[data-rot-l]").addEventListener("click", () => { rotZ -= 30; applyRot(); });
  if (q("[data-rot-r]")) q("[data-rot-r]").addEventListener("click", () => { rotZ += 30; applyRot(); });
  if (q("[data-rot-reset]")) q("[data-rot-reset]").addEventListener("click", () => { rotZ = -32; rotX = 58; applyRot(); resetZoom(); });
  if (q("[data-zoom-in]")) q("[data-zoom-in]").addEventListener("click", () => { zoom = clampZ(zoom * 1.25); applyZoom(); });
  if (q("[data-zoom-out]")) q("[data-zoom-out]").addEventListener("click", () => { zoom = clampZ(zoom / 1.25); applyZoom(); });
  if (q("[data-top]")) q("[data-top]").addEventListener("click", () => { rotX = 0; rotZ = 0; applyRot(); });
  section.querySelectorAll("[data-legend]").forEach((chip) => {
    chip.addEventListener("pointerenter", () => blocks.forEach((b) => b.classList.toggle("is-dim", !b.classList.contains("mm-" + chip.dataset.legend))));
    chip.addEventListener("pointerleave", () => blocks.forEach((b) => b.classList.remove("is-dim")));
  });
  const m = location.hash.match(/zone=([a-z]+)/);
  if (m) { const z = ZONES.find((x) => x.id === m[1]); if (z) select(z, blocks[ZONES.indexOf(z)]); }
})();
