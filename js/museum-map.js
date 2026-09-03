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
    // ---- The Gallery (plate x 0–5) ----
    { id: "drawing",   name: "Drawing Room",        x: 0.2, y: 0.2, w: 1.8, h: 1.8, z: 44, c: "z1", p: "mustard", roof: "pencil",   info: "Big paper, big crayons, big ideas. Open-ended mark-making for all ages.", ages: "1–10" },
    { id: "art",       name: "Art Studio",          x: 2.2, y: 0.2, w: 1.8, h: 1.8, z: 52, c: "z1", p: "terra",   roof: "sawtooth", info: "Paint, collage and mixed media with our resident artist. Aprons provided.", ages: "3–10" },
    { id: "looksee",   name: "Look & See",          x: 4.15, y: 0.2, w: 0.85, h: 1.8, z: 40, c: "z1", p: "sky",    roof: "lens",     info: "Light, shadow, mirrors and lenses — a gallery that changes as you move.", ages: "2–10" },
    { id: "colouring", name: "Colouring Wall",      x: 0.2, y: 2.2, w: 0.85, h: 2.0, z: 60, c: "z1", p: "sage",    roof: "crayons",  info: "A wall-sized colouring page that resets every week.", ages: "1–8" },
    { id: "shape",     name: "Shape Lab",           x: 1.25, y: 2.2, w: 1.65, h: 0.9, z: 38, c: "z1", p: "lilac",  roof: "blocks",   info: "Magnetic tiles, foam geometry and floor puzzles.", ages: "2–7" },
    { id: "pottery",   name: "Pottery Studio",      x: 3.1, y: 2.2, w: 1.9, h: 0.9, z: 46, c: "z1", p: "blush",   roof: "dome",     info: "Clay wheels sized for small hands. Pieces are fired and collected later.", ages: "4–10" },
    { id: "printing",  name: "Printing Lab",        x: 1.25, y: 3.3, w: 1.65, h: 0.9, z: 38, c: "z1", p: "sky2",   roof: "roller",   info: "Stamps, rollers, screens and ink. Take your print home.", ages: "3–10" },
    { id: "makers",    name: "Builders & Makers",   x: 3.1, y: 3.3, w: 1.9, h: 0.9, z: 42, c: "z1", p: "mustard2", roof: "tiers",   info: "Real tools, real wood, real cardboard — with a facilitator alongside.", ages: "5–10" },
    { id: "workshop",  name: "Builders' Workshop",  x: 0.2, y: 4.4, w: 1.8, h: 0.9, z: 54, c: "z1", p: "terra2",  roof: "stairs",   info: "Blocks, ramps and gears. Build tall, build wide, knock it down.", ages: "3–10" },
    { id: "drop",      name: "The Drop Tower",      x: 2.2, y: 4.4, w: 0.85, h: 0.9, z: 96, c: "z1", p: "lilac2",  roof: "drop",     info: "Three storeys of ramps, chutes and drops. Send a ball to the top and race it down.", ages: "3–10" },
    { id: "play",      name: "Play Studio",         x: 3.25, y: 4.4, w: 1.75, h: 0.9, z: 46, c: "z1", p: "blush2", roof: "stage",    info: "Dress-up, puppets and a little stage — a show on the hour.", ages: "2–8" },
    { id: "story",     name: "Story Studio",        x: 3.1, y: 5.5, w: 1.9, h: 0.75, z: 30, c: "z1", p: "sand2",  roof: "awning",   info: "Picture books, cushions and a storyteller three times a day.", ages: "1–8" },
    { id: "hello",     name: "Hello & Goodbye",     x: 0.2, y: 5.5, w: 2.7, h: 0.75, z: 18, c: "z1", p: "sand",   roof: "arch",     info: "Check in, stroller parking, lockers and the welcome desk. Play Facilitators start here — and wave you off at the end." },
    // ---- The Garden (green blob x 5–9.3) ----
    { id: "playscape", name: "Playscape",           x: 5.4, y: 0.15, w: 1.9, h: 1.7, z: 60, c: "z2", p: "moss",  roof: "tower",    info: "The climbing, sliding, hiding heart of the garden. Socks on!", ages: "1–8" },
    { id: "birds",     name: "Bird Watch",          x: 7.7, y: 0.05, w: 1.2, h: 1.0, z: 24, c: "z2", p: "leaf2", roof: "hide",     info: "A raised hide with binoculars and a bird-call board. Quiet feet, please.", ages: "3–10" },
    { id: "biomes",    name: "Desert & Rainforest", x: 7.4, y: 1.35, w: 1.85, h: 1.6, z: 22, c: "z2", p: "leaf",  roof: "biomes",   info: "Two climates side by side: hot sand and cacti, then mist, moss and dripping leaves.", ages: "2–10" },
    { id: "water",     name: "Water Lab",           x: 5.35, y: 2.15, w: 1.75, h: 0.95, z: 14, c: "z2", p: "mint", roof: "pond",     info: "Pumps, dams and boats. Waterproof smocks at the door.", ages: "1–7" },
    { id: "waterworks", name: "Water Works",        x: 5.3, y: 3.35, w: 1.65, h: 0.95, z: 26, c: "z2", p: "leaf2", roof: "wheel",   info: "Sluices, a wheel to turn and a pump to work — move water uphill and see where it goes.", ages: "3–10" },
    { id: "sound",     name: "Sight & Sound Lab",   x: 7.35, y: 3.25, w: 1.8, h: 0.95, z: 36, c: "z2", p: "moss",  roof: "blocks",   info: "Tubes, chimes, echoes and a whisper wall.", ages: "2–10" },
    { id: "senses",    name: "Super Senses",        x: 5.4, y: 4.6, w: 1.7, h: 1.05, z: 16, c: "z2", p: "mint",  roof: "ring",     info: "Barefoot paths, scent boxes and textures to touch — a garden for your whole body.", ages: "1–10" },
    { id: "horns",     name: "Whisper Horns",       x: 7.45, y: 4.55, w: 1.8, h: 1.05, z: 14, c: "z2", p: "leaf",  roof: "horns",    info: "Giant horns across the lawn carry a whisper from one end to the other.", ages: "2–10" },
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
  const COLS = 9.3, ROWS = 6.5, U = 84, GAP = 0;
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
      case "sawtooth":
        for (let i = 0; i < 3; i++) g.appendChild(place(box(w * 0.26, h * 0.7, 12 + (i % 2) * 6, color), 6 + i * w * 0.31, h * 0.15, z));
        break;
      case "lens":
        [0.42, 0.3].forEach((r, i) => g.appendChild(place(el("mm-disc", `--r:${Math.min(w, h) * r}px;--c:${color}`), cx, cy, z + i * 8)));
        g.appendChild(place(el("mm-disc", `--r:${Math.min(w, h) * 0.14}px;--c:${PAINT.accent}`), cx, cy, z + 17));
        break;
      case "crayons":
        [PAINT.accent, PAINT.terra2, PAINT.sand2, PAINT.blush2].forEach((c, i) => g.appendChild(place(box(w * 0.5, 12, 12 + i * 3, c), w * 0.25, 10 + i * (h - 20) / 4, z)));
        break;
      case "roller":
        g.appendChild(place(box(w * 0.55, h * 0.5, 10, color), w * 0.08, h * 0.25, z));
        g.appendChild(place(el("mm-disc", `--r:${h * 0.32}px;--c:${PAINT.accent}`), w * 0.8, cy, z));
        g.appendChild(place(el("mm-disc", `--r:${h * 0.32}px;--c:${PAINT.accent}`), w * 0.8, cy, z + 6));
        break;
      case "drop":
        g.appendChild(place(box(w * 0.66, h * 0.66, 18, color), cx - w * 0.33, cy - h * 0.33, z));
        g.appendChild(place(box(w * 0.36, h * 0.36, 16, color), cx - w * 0.18, cy - h * 0.18, z + 18));
        g.appendChild(place(el("mm-flag", `--c:${PAINT.accent}`), cx - 2, cy - 2, z + 34));
        break;
      case "stage":
        g.appendChild(place(el("mm-awning", `--w:${w - 24}px`), 12, h - 18, z + 1));
        g.appendChild(place(box(16, 16, 16, PAINT.accent), w * 0.12, 8, z));
        g.appendChild(place(el("mm-flag mm-flag--sm", `--c:${PAINT.accent}`), w * 0.86, 10, z));
        break;
      case "hide":
        g.appendChild(place(box(w * 0.5, h * 0.5, 34, color), cx - w * 0.25, cy - h * 0.25, z));
        g.appendChild(place(box(w * 0.5 + 8, h * 0.5 + 8, 6, PAINT.terra2), cx - w * 0.25 - 4, cy - h * 0.25 - 4, z + 34));
        for (let i = 0; i < 3; i++) g.appendChild(place(box(12, 12, 8, color), 8, h - 20 - i * 12, z - 24 + i * 12));
        break;
      case "biomes":
        [0.4, 0.3, 0.19].forEach((r, i) => g.appendChild(place(el("mm-disc", `--r:${Math.min(w, h) * r}px;--c:${PAINT.sand2}`), w * 0.28, cy, z + i * 8)));
        [0.42, 0.32, 0.2].forEach((r, i) => g.appendChild(place(el("mm-disc", `--r:${Math.min(w, h) * r}px;--c:${PAINT.moss}`), w * 0.72, cy, z + i * 9)));
        break;
      case "pond":
        g.appendChild(place(el("mm-pool", `--w:${w - 28}px;--h:${h - 22}px`), 14, 11, z + 1));
        g.appendChild(place(box(12, 12, 10, PAINT.accent), w - 30, 8, z));
        break;
      case "wheel":
        g.appendChild(place(el("mm-pool", `--w:${w * 0.5}px;--h:${h - 24}px`), 10, 12, z + 1));
        g.appendChild(place(box(22, 22, 22, color), w - 44, cy - 11, z));
        [0, 6].forEach((dz) => g.appendChild(place(el("mm-disc", `--r:15px;--c:${PAINT.accent}`), w - 33, cy, z + 22 + dz)));
        break;
      case "ring":
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.appendChild(place(el("mm-disc", `--r:9px;--c:${i % 2 ? PAINT.accent : PAINT.terra2}`), cx + Math.cos(a) * w * 0.32, cy + Math.sin(a) * h * 0.3, z)); }
        g.appendChild(place(el("mm-disc", `--r:${Math.min(w, h) * 0.16}px;--c:${color}`), cx, cy, z));
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

  // ---- island: two paper plates (Gallery: rounded slab, Garden: soft blob), paths, trees, a wandering visitor ----
  const plate = (cls, x, y, w, h, r, z) => { const e = el("mm-plate " + cls, `--w:${w}px;--h:${h}px;--r:${r};`); return place(e, x, y, z); };
  const GX = -10, GY = -10, GW = U * 5.1 + 10, GH = FH + 20;                    // gallery slab
  const RX = U * 4.9, RY = -22, RW = U * 4.4 + 22, RH = FH + 44;                 // garden blob
  const blobR = "46% 54% 42% 58% / 52% 44% 56% 48%";
  floor.appendChild(plate("mm-plate--shadow mm-plate--garden", RX + 6, RY + 14, RW, RH, blobR, -16));
  floor.appendChild(plate("mm-plate--shadow", GX + 4, GY + 14, GW, GH, "36px", -16));
  floor.appendChild(plate("mm-plate--base mm-plate--garden", RX, RY, RW, RH, blobR, -12));
  floor.appendChild(plate("mm-plate--base", GX, GY, GW, GH, "36px", -11));
  floor.appendChild(plate("mm-plate--top mm-plate--garden", RX, RY, RW, RH, blobR, -0.6));
  floor.appendChild(plate("mm-plate--top", GX, GY, GW, GH, "36px", 0));
  const galleryPlate = floor.querySelector(".mm-plate--top:not(.mm-plate--garden)"), gardenPlate = floor.querySelector(".mm-plate--top.mm-plate--garden");
  // 2D overlay for names: projected from the 3D scene each frame it moves, so nothing can hide them
  const stageEl = root.querySelector(".mm-stage");
  const tagLayer = el("mm-tags"); tagLayer.setAttribute("aria-hidden", "true"); stageEl.appendChild(tagLayer);
  const signs = { z1: el("mm-sign mm-sign--z1", "", "The Gallery"), z2: el("mm-sign mm-sign--z2", "", "The Garden") };
  Object.values(signs).forEach((sg) => tagLayer.appendChild(sg));
  // footpaths: gate → gallery spine → garden loop
  const P1 = `M${U * 1.55} ${FH + 12} L${U * 1.55} ${U * 4.3} C ${U * 1.55} ${U * 4.3}, ${U * 3} ${U * 4.3}, ${U * 5.05} ${U * 4.3} S ${U * 7.2} ${U * 3.1}, ${U * 7.15} ${U * 2.4} S ${U * 7.5} ${U * 1.25}, ${U * 8.3} ${U * 1.15}`;
  const paths = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  paths.setAttribute("class", "mm-paths"); paths.setAttribute("viewBox", `0 0 ${FW} ${FH}`); paths.style.overflow = "visible";
  paths.innerHTML = `<path d="${P1}"/><path d="M${U * 5.05} ${U * 4.3} C ${U * 5.6} ${U * 4.4}, ${U * 6.2} ${U * 5.4}, ${U * 7.2} ${U * 5.9} S ${U * 8.9} ${U * 5.6}, ${U * 9.0} ${U * 4.4}"/><path d="M${U * 5.05} ${U * 2.05} C ${U * 5.4} ${U * 2.0}, ${U * 6.6} ${U * 1.0}, ${U * 7.5} ${U * 1.2}"/>`;
  floor.appendChild(paths);
  const TREES = [[U * 7.05, U * 2.75], [U * 9.05, U * 2.65], [U * 6.35, U * 6.05], [U * 7.3, U * 6.1], [U * 8.4, U * 5.95], [U * 9.15, U * 4.1], [U * 5.25, U * 1.95], [U * 7.15, U * 0.5], [U * 9.1, U * 0.7], [U * 2.95, U * 5.95], [U * 5.25, U * 6.2]];
  (coarse ? TREES.filter((_, i) => i % 2 === 0) : TREES).forEach(([x, y], i) => {
    const t = el("mm-tree" + (i % 2 ? " mm-tree--round" : ""), `--c:${PAINT.tree};--s:${rnd(0.8, 1.15).toFixed(2)}`);
    t.appendChild(el("mm-tree-plane mm-tree-plane--a")); t.appendChild(el("mm-tree-plane mm-tree-plane--b"));
    floor.appendChild(place(t, x, y, 0));
  });
  const P2 = `M${U * 5.05} ${U * 4.3} C ${U * 5.6} ${U * 4.4}, ${U * 6.2} ${U * 5.4}, ${U * 7.2} ${U * 5.9} S ${U * 8.9} ${U * 5.6}, ${U * 9.0} ${U * 4.4}`;
  if (!coarse) [["#F06051", P1, 46, 0], ["#603F5B", P1, 58, -20], ["#7A9A6B", P2, 30, -8]].forEach(([c, path, dur, delay]) => {
    floor.appendChild(el("mm-visitor", `offset-path: path("${path}"); --c:${c}; animation-duration: ${dur}s; animation-delay: ${delay}s`));
  });
  // props: lamp posts along the gallery spine (they glow at night), bushes and benches in the garden
  [[U * 1.35, U * 4.15], [U * 3.2, U * 4.15], [U * 4.9, U * 4.15], [U * 1.35, U * 5.4], [U * 6.2, U * 1.95], [U * 8.6, U * 3.1]].forEach(([x, y]) => {
    const lamp = el("mm-lamp"); lamp.appendChild(place(box(5, 5, 30, "#8A6F86"), -2.5, -2.5, 0)); lamp.appendChild(place(el("mm-lamp-head"), -6, -6, 30)); floor.appendChild(place(lamp, x, y, 0));
  });
  [[U * 7.05, U * 1.15], [U * 9.0, U * 1.7], [U * 5.2, U * 3.15], [U * 7.1, U * 4.35], [U * 6.7, U * 5.7], [U * 8.85, U * 5.75], [U * 5.55, U * 5.95], [U * 9.2, U * 3.5]].forEach(([x, y], i) => {
    const bush = el("mm-bush", `--c:${i % 2 ? PAINT.moss : PAINT.leaf2}`); [10, 7].forEach((r, j) => bush.appendChild(place(el("mm-disc", `--r:${r}px;--c:${i % 2 ? PAINT.moss : PAINT.leaf2}`), 0, 0, j * 6))); floor.appendChild(place(bush, x, y, 0));
  });
  [[U * 2.6, U * 5.35], [U * 6.55, U * 3.05], [U * 8.2, U * 5.2]].forEach(([x, y]) => floor.appendChild(place(box(20, 7, 7, "#B08B72"), x, y, 0)));

  // ---- buildings ----
  const blocks = ZONES.map((z, zi) => {
    const w = z.w * U - GAP, h = z.h * U - GAP, color = PAINT[z.p];
    const b = document.createElement("button");
    b.type = "button"; b.className = "mm-block mm-" + z.c; b.dataset.id = z.id; b.setAttribute("aria-label", z.name);
    b.style.cssText = `--x:${z.x * U + GAP / 2}px;--y:${z.y * U + GAP / 2}px;--w:${w}px;--h:${h}px;--z:${z.z}px;--c:${color}`;
    if (!coarse) b.appendChild(el("mm-shadow"));
    b.appendChild(box(w, h, z.z, color, "mm-body"));
    b.appendChild(roof(z.roof, w, h, z.z, color));
    const tag = el("mm-tag mm-tag--" + z.c, "", z.name); tagLayer.appendChild(tag); b._tag = tag;
    b.addEventListener("pointerenter", () => { tag.classList.add("is-hot"); kick(); });
    b.addEventListener("pointerleave", () => tag.classList.remove("is-hot"));
    b.addEventListener("focus", () => tag.classList.add("is-hot")); b.addEventListener("blur", () => tag.classList.remove("is-hot"));
    floor.appendChild(b);
    b.addEventListener("click", () => select(z, b));
    return b;
  });

  function showTip(z, e) { if (coarse) return; tip.textContent = z.name + (z.ages ? " · ages " + z.ages : ""); tip.hidden = false; moveTip(e); }
  function moveTip(e) { const r = root.getBoundingClientRect(); tip.style.left = e.clientX - r.left + 14 + "px"; tip.style.top = e.clientY - r.top - 10 + "px"; }
  function hideTip() { tip.hidden = true; }

  let selected = null;
  function deselect() { selected = null; blocks.forEach((x) => { x.classList.remove("is-selected"); x._tag.classList.remove("is-on"); }); panel.classList.remove("is-live"); panel.hidden = true; }
  function select(z, b) {
    if (selected === z) { deselect(); return; }
    selected = z;
    blocks.forEach((x) => { x.classList.toggle("is-selected", x === b); x._tag.classList.toggle("is-on", x === b); });
    kick();
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
  let rotZ = -32, rotX = 58, dragging = false, sx = 0, sy = 0, rz0 = 0, rx0 = 0, moved = 0;
  const stage = root.querySelector(".mm-stage");
  // project 3D positions → 2D overlay (tags above each roof, district signs beside each plate)
  let until = 0, looping = false;
  function updateTags() {
    const sr = stageEl.getBoundingClientRect();
    blocks.forEach((b) => { const r = b.querySelector(".mm-top").getBoundingClientRect(); b._tag.style.transform = `translate(${(r.left + r.width / 2 - sr.left).toFixed(1)}px, ${(r.top - sr.top - 6).toFixed(1)}px)`; });
    const g = galleryPlate.getBoundingClientRect(), d = gardenPlate.getBoundingClientRect();
    // keep the district signs fully on screen (and clear of an open side card)
    const card = document.body.classList.contains("sheet-open") && sr.width > 900 ? document.querySelector(".sheet-layer") : null;
    const rightEdge = (card ? card.getBoundingClientRect().left : sr.right) - sr.left - 12;
    const w1 = signs.z1.offsetWidth, w2 = signs.z2.offsetWidth;
    const x1 = Math.max(12 + w1, g.left - sr.left - 14), x2 = Math.min(rightEdge - w2, d.right - sr.left + 14);
    signs.z1.style.transform = `translate(${x1.toFixed(1)}px, ${(g.top + g.height * 0.5 - sr.top).toFixed(1)}px)`;
    signs.z2.style.transform = `translate(${x2.toFixed(1)}px, ${(d.top + d.height * 0.45 - sr.top).toFixed(1)}px)`;
  }
  function loop(now) { updateTags(); if (now < until) requestAnimationFrame(loop); else looping = false; }
  function kick(ms) { until = performance.now() + (ms || 700); if (!looping) { looping = true; requestAnimationFrame(loop); } }
  const applyRot = () => { floor.style.transform = `rotateX(${rotX}deg) rotateZ(${rotZ}deg)`; root.style.setProperty("--rz", -rotZ + "deg"); root.style.setProperty("--rx", rotX + "deg"); kick(); };
  applyRot();
  // fit: scale the island to whatever stage size we have (phones, tablets, desktops)
  const fit = () => {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const s = Math.min(1.04, (sw - 24) / (FW * 1.3), (sh - (sw < 900 ? 250 : 290)) / (FH * 1.12));
    root.style.setProperty("--mm-fit", Math.max(0.22, s).toFixed(3));
  };
  fit(); window.addEventListener("resize", () => { fit(); kick(); });
  new MutationObserver(() => kick(900)).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => kick());
  window.addEventListener("load", () => kick());
  kick(1200);
  // ---- zoom & pan: pinch on touch, +/- buttons, ctrl/⌘ + wheel; double-tap or Reset to clear ----
  let zoom = 1, panX = 0, panY = 0, pinch = null, lastTap = 0;
  const clampZ = (z) => Math.min(2.8, Math.max(0.6, z));
  const applyZoom = () => { stage.classList.toggle("is-zoomed", zoom >= 1.3); root.style.setProperty("--mm-zoom", zoom.toFixed(3)); root.style.setProperty("--mm-pan-x", panX.toFixed(1) + "px"); root.style.setProperty("--mm-pan-y", panY.toFixed(1) + "px"); kick(); };
  const resetZoom = () => { zoom = 1; panX = 0; panY = 0; applyZoom(); };
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const ptrs = new Map();
  stage.addEventListener("wheel", (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoom = clampZ(zoom * (e.deltaY < 0 ? 1.08 : 0.92)); applyZoom(); }, { passive: false });
  const isUI = (t) => t.closest(".mm-panel, .mm-ctl, .mm-chip, .stage-menu, .wx-card, .mm-legend, .mm-controls");
  stage.addEventListener("pointerdown", (e) => {
    if (isUI(e.target)) return;
    if (e.pointerType === "touch") {
      if (!e.target.closest(".mm-floor")) return;                 // touches on the sky scroll the page
      ptrs.set(e.pointerId, e);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: dist(a, b), z: zoom, mx: (a.clientX + b.clientX) / 2, my: (a.clientY + b.clientY) / 2, px: panX, py: panY }; stage.classList.add("is-pinching"); dragging = false; return; }
      const now = Date.now(); if (now - lastTap < 320 && !e.target.closest(".mm-block")) { resetZoom(); }
      lastTap = now;
    } else if (e.target.closest(".mm-block, button, a")) return;
    dragging = true; sx = e.clientX; sy = e.clientY; rz0 = rotZ; rx0 = rotX; moved = 0; stage.classList.add("is-dragging");
  });
  stage.addEventListener("pointermove", (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, e);
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; zoom = clampZ(pinch.z * dist(a, b) / pinch.d); panX = pinch.px + ((a.clientX + b.clientX) / 2 - pinch.mx); panY = pinch.py + ((a.clientY + b.clientY) / 2 - pinch.my); applyZoom(); return; }
    if (!dragging) return;
    moved = Math.max(moved, Math.abs(e.clientX - sx), Math.abs(e.clientY - sy));
    rotZ = rz0 + (e.clientX - sx) * 0.4; rotX = Math.max(30, Math.min(75, rx0 - (e.clientY - sy) * 0.25)); applyRot();
  });
  const stop = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) { pinch = null; stage.classList.remove("is-pinching"); } dragging = false; stage.classList.remove("is-dragging"); };
  stage.addEventListener("pointerup", stop); stage.addEventListener("pointercancel", stop); stage.addEventListener("lostpointercapture", stop);
  // a drag that moved should not count as a tap on a building
  stage.addEventListener("click", (e) => { if (moved > 8 && e.target.closest(".mm-block")) { e.stopImmediatePropagation(); e.preventDefault(); moved = 0; } }, true);
  const q = (s) => section.querySelector(s);
  if (q("[data-rot-l]")) q("[data-rot-l]").addEventListener("click", () => { rotZ -= 30; applyRot(); });
  if (q("[data-rot-r]")) q("[data-rot-r]").addEventListener("click", () => { rotZ += 30; applyRot(); });
  if (q("[data-rot-reset]")) q("[data-rot-reset]").addEventListener("click", () => { rotZ = -32; rotX = 58; applyRot(); resetZoom(); });
  if (q("[data-zoom-in]")) q("[data-zoom-in]").addEventListener("click", () => { zoom = clampZ(zoom * 1.25); applyZoom(); });
  if (q("[data-zoom-out]")) q("[data-zoom-out]").addEventListener("click", () => { zoom = clampZ(zoom / 1.25); applyZoom(); });
  if (q("[data-top]")) q("[data-top]").addEventListener("click", () => { rotX = 0; rotZ = 0; applyRot(); });
  let filterOn = null;
  const chips = [...section.querySelectorAll("[data-legend]")];
  const applyFilter = (grp) => { blocks.forEach((b) => { const dim = !!grp && !b.classList.contains("mm-" + grp); b.classList.toggle("is-dim", dim); b._tag.classList.toggle("is-dim", dim); }); chips.forEach((c) => c.classList.toggle("is-on", c.dataset.legend === filterOn)); Object.entries(signs).forEach(([k, sg]) => sg.classList.toggle("is-on", k === filterOn)); };
  Object.entries(signs).forEach(([k, sg]) => { sg.setAttribute("role", "button"); sg.tabIndex = 0; sg.addEventListener("click", () => { filterOn = filterOn === k ? null : k; applyFilter(filterOn); }); });
  chips.forEach((chip) => {
    chip.setAttribute("role", "button"); chip.tabIndex = 0;
    chip.addEventListener("click", () => { filterOn = filterOn === chip.dataset.legend ? null : chip.dataset.legend; applyFilter(filterOn); });
    chip.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chip.click(); } });
    if (!coarse) {
      chip.addEventListener("pointerenter", () => applyFilter(chip.dataset.legend));
      chip.addEventListener("pointerleave", () => applyFilter(filterOn));
    }
  });
  const m = location.hash.match(/zone=([a-z]+)/);
  if (m) { const z = ZONES.find((x) => x.id === m[1]); if (z) select(z, blocks[ZONES.indexOf(z)]); }
})();
