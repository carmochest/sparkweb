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
    { id: "drawing",   name: "Drawing Room",        x: 0.2, y: 0.2, w: 1.8, h: 1.8, z: 44, c: "z1", p: "mustard", roof: "drawing",   info: "Big paper, big crayons, big ideas. Open-ended mark-making for all ages.", ages: "1–10" },
    { id: "art",       name: "Art Studio",          x: 2.2, y: 0.2, w: 1.8, h: 1.8, z: 52, c: "z1", p: "terra",   roof: "art", info: "Paint, collage and mixed media with our resident artist. Aprons provided.", ages: "3–10" },
    { id: "looksee",   name: "Look & See",          x: 4.15, y: 0.2, w: 0.85, h: 1.8, z: 40, c: "z1", p: "sky",    roof: "looksee",     info: "Light, shadow, mirrors and lenses — a gallery that changes as you move.", ages: "2–10" },
    { id: "colouring", name: "Colouring Wall",      x: 0.2, y: 2.2, w: 0.85, h: 2.0, z: 60, c: "z1", p: "sage",    roof: "colouring",  info: "A wall-sized colouring page that resets every week.", ages: "1–8" },
    { id: "shape",     name: "Shape Lab",           x: 1.25, y: 2.2, w: 1.65, h: 0.9, z: 38, c: "z1", p: "lilac",  roof: "shape",   info: "Magnetic tiles, foam geometry and floor puzzles.", ages: "2–7" },
    { id: "pottery",   name: "Pottery Studio",      x: 3.1, y: 2.2, w: 1.9, h: 0.9, z: 46, c: "z1", p: "blush",   roof: "pottery",     info: "Clay wheels sized for small hands. Pieces are fired and collected later.", ages: "4–10" },
    { id: "printing",  name: "Printing Lab",        x: 1.25, y: 3.3, w: 1.65, h: 0.9, z: 38, c: "z1", p: "sky2",   roof: "printing",   info: "Stamps, rollers, screens and ink. Take your print home.", ages: "3–10" },
    { id: "makers",    name: "Builders & Makers",   x: 3.1, y: 3.3, w: 1.9, h: 0.9, z: 42, c: "z1", p: "mustard2", roof: "makers",   info: "Real tools, real wood, real cardboard — with a facilitator alongside.", ages: "5–10" },
    { id: "workshop",  name: "Builders' Workshop",  x: 0.2, y: 4.4, w: 1.8, h: 0.9, z: 54, c: "z1", p: "terra2",  roof: "workshop",   info: "Blocks, ramps and gears. Build tall, build wide, knock it down.", ages: "3–10" },
    { id: "drop",      name: "The Drop Tower",      x: 2.2, y: 4.4, w: 0.85, h: 0.9, z: 96, c: "z1", p: "lilac2",  roof: "drop",     info: "Three storeys of ramps, chutes and drops. Send a ball to the top and race it down.", ages: "3–10" },
    { id: "play",      name: "Play Studio",         x: 3.25, y: 4.4, w: 1.75, h: 0.9, z: 46, c: "z1", p: "blush2", roof: "play",    info: "Dress-up, puppets and a little stage — a show on the hour.", ages: "2–8" },
    { id: "story",     name: "Story Studio",        x: 3.1, y: 5.5, w: 1.9, h: 0.75, z: 30, c: "z1", p: "sand2",  roof: "story",   info: "Picture books, cushions and a storyteller three times a day.", ages: "1–8" },
    { id: "hello",     name: "Hello & Goodbye",     x: 0.2, y: 5.5, w: 2.7, h: 0.75, z: 18, c: "z1", p: "sand",   roof: "hello",     info: "Check in, stroller parking, lockers and the welcome desk. Play Facilitators start here — and wave you off at the end." },
    // ---- The Garden (green blob x 5–9.3) ----
    { id: "playscape", name: "Playscape",           x: 5.4, y: 0.15, w: 1.9, h: 1.7, z: 60, c: "z2", p: "moss",  roof: "playscape",    info: "The climbing, sliding, hiding heart of the garden. Socks on!", ages: "1–8" },
    { id: "birds",     name: "Bird Watch",          x: 7.7, y: 0.05, w: 1.2, h: 1.0, z: 24, c: "z2", p: "leaf2", roof: "birds",     info: "A raised hide with binoculars and a bird-call board. Quiet feet, please.", ages: "3–10" },
    { id: "biomes",    name: "Desert & Rainforest", x: 7.4, y: 1.35, w: 1.85, h: 1.6, z: 22, c: "z2", p: "leaf",  roof: "biomes",   info: "Two climates side by side: hot sand and cacti, then mist, moss and dripping leaves.", ages: "2–10" },
    { id: "water",     name: "Water Lab",           x: 5.35, y: 2.15, w: 1.75, h: 0.95, z: 14, c: "z2", p: "mint", roof: "water",     info: "Pumps, dams and boats. Waterproof smocks at the door.", ages: "1–7" },
    { id: "waterworks", name: "Water Works",        x: 5.3, y: 3.35, w: 1.65, h: 0.95, z: 26, c: "z2", p: "leaf2", roof: "waterworks",   info: "Sluices, a wheel to turn and a pump to work — move water uphill and see where it goes.", ages: "3–10" },
    { id: "sound",     name: "Sight & Sound Lab",   x: 7.35, y: 3.25, w: 1.8, h: 0.95, z: 36, c: "z2", p: "moss",  roof: "sound",   info: "Tubes, chimes, echoes and a whisper wall.", ages: "2–10" },
    { id: "senses",    name: "Super Senses",        x: 5.4, y: 4.6, w: 1.7, h: 1.05, z: 16, c: "z2", p: "mint",  roof: "senses",     info: "Barefoot paths, scent boxes and textures to touch — a garden for your whole body.", ages: "1–10" },
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
  const place = (node, x, y, z) => {
    if (node.classList.contains("mm-flag") || node.classList.contains("mm-slide") || node.classList.contains("mm-plane")) {
      const a = el("mm-anchor" + (node.classList.contains("mm-slide") ? "" : " mm-anchor--bb"), `transform: translate3d(${x}px, ${y}px, ${z}px)${node.classList.contains("mm-slide") ? "" : " rotateZ(var(--rz, 32deg))"}`);
      a.appendChild(node); return a;
    }
    node.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`; return node;
  };
  // small helpers for decorations
  const disc = (r, c) => el("mm-disc", `--r:${r}px;--c:${c}`);
  const stack = (g, x, y, z, radii, step, c) => radii.forEach((r, i) => g.appendChild(place(disc(r, c), x, y, z + i * step)));
  const pole = (g, x, y, z, hgt, c) => g.appendChild(place(box(3, 3, hgt, c || "#8A6F86"), x - 1.5, y - 1.5, z));
  const tinyTree = (g, x, y, z, c, sc) => { const t = el("mm-tree mm-tree--round", `--c:${c};--s:${sc || 0.6}`); t.appendChild(el("mm-tree-plane mm-tree-plane--a")); t.appendChild(el("mm-tree-plane mm-tree-plane--b")); g.appendChild(place(t, x, y, z)); };

  /* Per-zone decoration: every roof tells you what the room is for. (w,h footprint px, z roof height px) */
  function roof(kind, w, h, z, color) {
    const g = el("mm-roof"), cx = w / 2, cy = h / 2, A = PAINT.accent, P3 = PAINT.terra2, S2 = PAINT.sand2, B2 = PAINT.blush2, WH = "#FFFDF7";
    switch (kind) {
      case "drawing":   // giant crayon + sheets of paper on the roof
        g.appendChild(place(el("mm-crayon", `--c:${A}`), cx - 14, cy - 14, z));
        [[0.12, 0.62], [0.62, 0.15], [0.7, 0.66]].forEach(([fx, fy], i) => g.appendChild(place(box(22, 16, 1.5, WH), w * fx, h * fy, z)));
        g.appendChild(place(box(10, 10, 6, P3), w * 0.14, h * 0.18, z));
        break;
      case "art":       // sawtooth skylights + paint pots
        for (let i = 0; i < 3; i++) g.appendChild(place(box(w * 0.24, h * 0.55, 12 + (i % 2) * 5, color), 8 + i * w * 0.3, h * 0.08, z));
        [[0.2, A], [0.5, P3], [0.8, S2]].forEach(([fx, c]) => { g.appendChild(place(box(10, 10, 9, WH), w * fx - 5, h * 0.78 - 5, z)); g.appendChild(place(disc(4, c), w * fx, h * 0.78, z + 9)); });
        break;
      case "looksee":   // big lens + a periscope
        stack(g, cx, cy * 1.3, z, [Math.min(w, h) * 0.42, Math.min(w, h) * 0.3], 8, color);
        g.appendChild(place(disc(Math.min(w, h) * 0.13, A), cx, cy * 1.3, z + 17));
        g.appendChild(place(box(8, 8, 38, P3), cx - 4, h * 0.14, z)); g.appendChild(place(box(8, 18, 8, A), cx - 4, h * 0.14 - 10, z + 38));
        break;
      case "colouring": // crayon rack + the wall itself is striped (CSS)
        [A, P3, S2, B2].forEach((c, i) => g.appendChild(place(box(w * 0.5, 11, 10 + i * 3, c), w * 0.25, 8 + i * (h - 18) / 4, z)));
        break;
      case "shape":     // cube, cone, cylinder, wedge
        g.appendChild(place(box(18, 18, 18, A), w * 0.1, h * 0.2, z));
        g.appendChild(place(el("mm-cone mm-cone--sm", `--c:${P3}`), w * 0.42, h * 0.15, z)); g.appendChild(place(box(18, 18, 0.5, P3), w * 0.42, h * 0.15, z));
        stack(g, w * 0.78, h * 0.5, z, [9, 9, 9], 5, S2);
        g.appendChild(place(box(24, 12, 10, B2), w * 0.3, h * 0.62, z));
        break;
      case "pottery":   // kiln dome + pots on a shelf
        stack(g, w * 0.32, cy, z, [0.44, 0.34, 0.24, 0.13].map((r) => Math.min(w, h) * r), 9, color);
        [0.66, 0.78, 0.9].forEach((fx, i) => stack(g, w * fx, h * (0.3 + i * 0.2), z, [5, 4, 5], 4, i % 2 ? P3 : S2));
        break;
      case "printing":  // ink roller + a stack of prints
        g.appendChild(place(box(w * 0.5, h * 0.5, 10, color), w * 0.08, h * 0.25, z));
        [0, 6].forEach((dz) => g.appendChild(place(disc(h * 0.3, A), w * 0.8, cy, z + dz)));
        [0, 1, 2].forEach((i) => g.appendChild(place(box(20, 14, 1.5, i % 2 ? WH : B2), w * 0.14 + i * 3, h * 0.3 + i * 2, z + 10 + i * 1.5)));
        break;
      case "makers":    // workbench + a little crane
        g.appendChild(place(box(w * 0.42, h * 0.5, 14, color), w * 0.06, h * 0.25, z));
        g.appendChild(place(box(6, 6, 48, P3), w * 0.72, h * 0.62, z)); g.appendChild(place(box(w * 0.34, 5, 5, P3), w * 0.44, h * 0.62, z + 46));
        g.appendChild(place(box(3, 3, 22, "#6E4F69"), w * 0.5, h * 0.63, z + 24)); g.appendChild(place(box(12, 12, 12, A), w * 0.46, h * 0.56, z + 12));
        break;
      case "workshop":  // stairs up the side + a tumbling block stack
        for (let i = 0; i < 4; i++) g.appendChild(place(box(18, 18, 10, color), w - 26, 10 + i * 16, z - 40 + i * 12));
        g.appendChild(place(box(w * 0.4, h * 0.5, 12, color), 10, 10, z));
        [[0.12, 0.25, A, 16], [0.3, 0.6, P3, 12], [0.5, 0.2, S2, 20], [0.62, 0.6, B2, 10]].forEach(([fx, fy, c, sz]) => g.appendChild(place(box(sz, sz, sz, c), w * fx, h * fy, z + (fx < 0.5 ? 12 : 0))));
        break;
      case "drop":      // ramps spiralling down the tower, flag on top
        g.appendChild(place(box(w * 0.66, h * 0.66, 16, color), cx - w * 0.33, cy - h * 0.33, z));
        [[0, 0, 24, 6], [w - 6, 0, 6, 24], [0, h - 6, 24, 6], [0, 0, 6, 24]].forEach(([x, y, bw, bh], i) => g.appendChild(place(box(bw, bh, 4, i % 2 ? A : S2), x, y, z - 20 - i * 18)));
        g.appendChild(place(el("mm-flag", `--c:${A}`), cx, cy, z + 16));
        stack(g, w * 0.82, h * 0.82, z, [4], 0, A);
        break;
      case "play":      // little stage with a striped awning and a spotlight
        g.appendChild(place(el("mm-awning", `--w:${w - 24}px`), 12, h - 18, z + 1));
        g.appendChild(place(box(w * 0.5, h * 0.4, 6, S2), w * 0.25, h * 0.2, z));
        pole(g, w * 0.14, h * 0.2, z, 34); g.appendChild(place(el("mm-cone mm-cone--sm", `--c:${A}`), w * 0.14 - 9, h * 0.2 - 9, z + 34));
        g.appendChild(place(el("mm-flag mm-flag--sm", `--c:${A}`), w * 0.88, h * 0.22, z));
        break;
      case "story":     // open book + cushions
        g.appendChild(place(box(22, 16, 2, WH), cx - 24, cy - 8, z + 4)); g.appendChild(place(box(22, 16, 2, WH), cx + 2, cy - 8, z + 4)); g.appendChild(place(box(46, 16, 4, P3), cx - 23, cy - 8, z));
        [[0.15, 0.3, A], [0.82, 0.32, S2], [0.2, 0.75, B2], [0.8, 0.74, P3]].forEach(([fx, fy, c]) => stack(g, w * fx, h * fy, z, [7], 0, c));
        g.appendChild(place(el("mm-awning", `--w:${w - 24}px`), 12, h - 18, z + 1));
        break;
      case "hello":     // welcome arch + sign + pram
        g.appendChild(place(box(12, 26, 44, color), w * 0.38, cy - 13, z)); g.appendChild(place(box(12, 26, 44, color), w * 0.62 - 12, cy - 13, z));
        g.appendChild(place(box(w * 0.24 + 12, 26, 10, A), w * 0.38, cy - 13, z + 44));
        g.appendChild(place(el("mm-flag mm-flag--sm", `--c:${A}`), w * 0.5, cy, z + 54));
        g.appendChild(place(box(3, 3, 22, "#8A6F86"), w * 0.12, h * 0.5, z)); g.appendChild(place(el("mm-plane mm-sign3d"), w * 0.12, h * 0.5, z + 14));
        g.appendChild(place(box(12, 8, 6, P3), w * 0.84, h * 0.55, z));
        break;
      // ---- garden ----
      case "playscape": // climbing tower, slide, swing frame, monkey bars
        g.appendChild(place(box(34, 34, 56, color), w - 54, 12, z));
        g.appendChild(place(el("mm-cone", `--c:${A}`), w - 54, 12, z + 56));
        g.appendChild(place(el("mm-slide", `--c:${A}`), w - 42, 46, z + 40));
        g.appendChild(place(box(28, 28, 30, PAINT.leaf2), 14, 14, z)); g.appendChild(place(box(w - 82, 6, 4, P3), 42, 26, z + 30));
        pole(g, 16, h - 18, z, 26, P3); pole(g, 52, h - 18, z, 26, P3); g.appendChild(place(box(38, 3, 3, P3), 15, h - 19.5, z + 24));
        [24, 42].forEach((x) => { g.appendChild(place(box(1.5, 1.5, 14, "#6E4F69"), x, h - 18.7, z + 10)); g.appendChild(place(box(8, 4, 2, A), x - 3, h - 20, z + 8)); });
        break;
      case "birds":     // raised hide + birdhouse on a pole
        g.appendChild(place(box(w * 0.46, h * 0.5, 30, color), w * 0.08, cy - h * 0.25, z));
        g.appendChild(place(box(w * 0.46 + 8, h * 0.5 + 8, 5, P3), w * 0.08 - 4, cy - h * 0.25 - 4, z + 30));
        for (let i = 0; i < 3; i++) g.appendChild(place(box(10, 10, 6, color), w * 0.58, h * 0.72 - i * 10, z - 18 + i * 9));
        pole(g, w * 0.8, h * 0.4, z, 30); g.appendChild(place(box(12, 12, 12, S2), w * 0.8 - 6, h * 0.4 - 6, z + 30)); g.appendChild(place(el("mm-cone mm-cone--sm", `--c:${A}`), w * 0.8 - 9, h * 0.4 - 9, z + 42));
        break;
      case "biomes":    // sand dome with cacti · moss dome with jungle trees
        stack(g, w * 0.28, cy, z, [0.36, 0.26, 0.15].map((r) => Math.min(w, h) * r), 8, S2);
        [[0.1, 0.2], [0.42, 0.8]].forEach(([fx, fy]) => { g.appendChild(place(box(6, 6, 22, PAINT.moss), w * fx, h * fy, z)); g.appendChild(place(box(5, 5, 9, PAINT.moss), w * fx + 8, h * fy, z + 8)); });
        stack(g, w * 0.72, cy, z, [0.38, 0.28, 0.16].map((r) => Math.min(w, h) * r), 9, PAINT.moss);
        tinyTree(g, w * 0.62, h * 0.15, z, "#7FA07A", 0.55); tinyTree(g, w * 0.9, h * 0.8, z, "#7FA07A", 0.5);
        break;
      case "water":     // pond with a fountain, lily pads and a boat
        g.appendChild(place(el("mm-pool", `--w:${w - 26}px;--h:${h - 20}px`), 13, 10, z + 1));
        stack(g, cx, cy, z, [10, 6], 8, WH); g.appendChild(place(disc(4, "#DDEBF0"), cx, cy, z + 20));
        [[0.25, 0.7], [0.72, 0.3], [0.8, 0.72]].forEach(([fx, fy]) => g.appendChild(place(disc(4, PAINT.moss), w * fx, h * fy, z + 2)));
        g.appendChild(place(box(12, 6, 4, A), w * 0.28, h * 0.3, z + 2));
        break;
      case "waterworks": // channel + wheel + pump
        g.appendChild(place(el("mm-pool", `--w:${w * 0.62}px;--h:${h * 0.32}px`), w * 0.06, h * 0.34, z + 1));
        g.appendChild(place(box(22, 22, 22, color), w - 44, cy - 11, z));
        [0, 6].forEach((dz) => g.appendChild(place(disc(15, A), w - 33, cy, z + 22 + dz)));
        g.appendChild(place(box(6, w * 0.5, 4, P3), w * 0.72, h * 0.1, z + 10)); g.appendChild(place(box(10, 10, 16, P3), w * 0.14, h * 0.1, z)); g.appendChild(place(box(3, 3, 14, "#6E4F69"), w * 0.18, h * 0.05, z + 16));
        break;
      case "sound":     // a row of chimes, a big horn, a mirror
        [14, 22, 30, 20, 26].forEach((hh, i) => g.appendChild(place(box(5, 5, hh, i % 2 ? A : S2), w * 0.08 + i * 12, h * 0.25, z)));
        g.appendChild(place(box(w * 0.5, 4, 4, P3), w * 0.06, h * 0.22, z + 32));
        stack(g, w * 0.78, h * 0.32, z, [12, 8, 5], 7, color); g.appendChild(place(el("mm-cone mm-cone--sm", `--c:${A}`), w * 0.78 - 9, h * 0.32 - 9, z + 21));
        g.appendChild(place(box(16, 3, 22, WH), w * 0.62, h * 0.72, z));
        break;
      case "senses":    // ring of textured pads + stepping stones + scent boxes
        for (let i = 0; i < 6; i++) { const a2 = i / 6 * Math.PI * 2; g.appendChild(place(disc(8, i % 2 ? A : P3), cx + Math.cos(a2) * w * 0.3, cy + Math.sin(a2) * h * 0.28, z)); }
        g.appendChild(place(disc(Math.min(w, h) * 0.14, S2), cx, cy, z));
        [[0.06, 0.5], [0.16, 0.5]].forEach(([fx, fy]) => g.appendChild(place(disc(4, WH), w * fx, h * fy, z + 1)));
        [[0.86, 0.2], [0.92, 0.5], [0.86, 0.8]].forEach(([fx, fy], i) => g.appendChild(place(box(9, 9, 9, [A, S2, B2][i]), w * fx - 4, h * fy - 4, z)));
        break;
      case "horns":     // two whisper horns on stands, facing each other
        [[16, 12, P3], [w - 34, h - 30, A]].forEach(([x, y, c]) => { g.appendChild(place(box(18, 18, 10, color), x, y, z)); g.appendChild(place(el("mm-cone mm-cone--sm", `--c:${c}`), x, y, z + 10)); });
        [0.3, 0.45, 0.6].forEach((t) => g.appendChild(place(disc(3, WH), 25 + (w - 50) * t, 21 + (h - 42) * t, z + 1)));
        break;
    }
    return g;
  }

  // ---- island: two paper plates (Gallery: rounded slab, Garden: soft blob), paths, trees, a wandering visitor ----
  const plate = (cls, x, y, w, h, r, z) => { const e = el("mm-plate " + cls, `--w:${w}px;--h:${h}px;--r:${r};`); return place(e, x, y, z); };
  const GX = -10, GY = -10, GW = U * 5.1 + 10, GH = FH + 20;                    // gallery slab
  const RX = U * 4.9, RY = -22, RW = U * 4.4 + 22, RH = FH + 44;                 // garden blob
  const blobR = "46% 54% 42% 58% / 52% 44% 56% 48%", slabR = "40px 40px 120px 40px / 40px 40px 140px 40px";
  floor.appendChild(plate("mm-plate--shadow mm-plate--garden", RX + 6, RY + 14, RW, RH, blobR, -16));
  floor.appendChild(plate("mm-plate--shadow", GX + 4, GY + 14, GW, GH, slabR, -16));
  floor.appendChild(plate("mm-plate--shadow", U * 0.55, FH - 18, U * 2.2, U * 1.2, "50%", -16));
  floor.appendChild(plate("mm-plate--base mm-plate--garden", RX, RY, RW, RH, blobR, -12));
  floor.appendChild(plate("mm-plate--base", GX, GY, GW, GH, slabR, -11));
  floor.appendChild(plate("mm-plate--base mm-plate--plaza", U * 0.5, FH - 30, U * 2.2, U * 1.2, "50%", -10));
  floor.appendChild(plate("mm-plate--top mm-plate--garden", RX, RY, RW, RH, blobR, -0.6));
  floor.appendChild(plate("mm-plate--top", GX, GY, GW, GH, slabR, 0));
  floor.appendChild(plate("mm-plate--top mm-plate--plaza", U * 0.5, FH - 30, U * 2.2, U * 1.2, "50%", 0.3));
  const galleryPlate = floor.querySelector(".mm-plate--top:not(.mm-plate--garden):not(.mm-plate--plaza)"), gardenPlate = floor.querySelector(".mm-plate--top.mm-plate--garden");
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
    b.dataset.kind = z.roof;
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
