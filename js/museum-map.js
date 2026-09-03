/* Spark Play Museum — interactive 3D map (MOCK LAYOUT)
   An isometric floor plan built from CSS 3D transforms. Zones are extruded
   blocks on a grid; hover lifts a block, click selects it and fills the info
   panel; drag (or the buttons) rotates the whole floor. Layout below is a
   placeholder — replace ZONES with the real plan when available. */
(function () {
  const root = document.querySelector("[data-museum-map]");
  if (!root) return;
  const section = root.closest("section") || document;

  // Grid units: x (columns), y (rows), w/h footprint, z = block height (px), c = colour key
  const ZONES = [
    { id: "entrance",  name: "Entrance & Tickets",  x: 0, y: 5, w: 3, h: 1, z: 22, c: "z4",   info: "Check in, stroller parking, lockers and the welcome desk. Play Facilitators start here." },
    { id: "drawing",   name: "Drawing Room",        x: 0, y: 0, w: 2, h: 2, z: 44, c: "z1", info: "Big paper, big crayons, big ideas. Open-ended mark-making for all ages.", ages: "1–10" },
    { id: "art",       name: "Art Studio",          x: 2, y: 0, w: 2, h: 2, z: 52, c: "z2",   info: "Paint, collage and mixed media with our resident artist. Aprons provided.", ages: "3–10" },
    { id: "looksee",   name: "Look & See",          x: 4, y: 0, w: 2, h: 1, z: 36, c: "z3",    info: "Light, shadow, mirrors and lenses — a gallery that changes as you move.", ages: "2–10" },
    { id: "coloring",  name: "Coloring Wall",       x: 6, y: 0, w: 1, h: 2, z: 60, c: "z1",  info: "A wall-sized colouring page that resets every week.", ages: "1–8" },
    { id: "shape",     name: "Shape Lab",           x: 4, y: 1, w: 2, h: 1, z: 40, c: "z1", info: "Magnetic tiles, foam geometry and floor puzzles.", ages: "2–7" },
    { id: "builder",   name: "Builder's Workshop",  x: 0, y: 2, w: 2, h: 2, z: 56, c: "z2",   info: "Blocks, ramps and gears. Build tall, build wide, knock it down.", ages: "3–10" },
    { id: "maker",     name: "Builder & Maker",     x: 2, y: 2, w: 2, h: 1, z: 42, c: "z3",    info: "Real tools, real wood, real cardboard — with a facilitator alongside.", ages: "5–10" },
    { id: "printing",  name: "Printing Lab",        x: 2, y: 3, w: 2, h: 1, z: 38, c: "z1",  info: "Stamps, rollers, screens and ink. Take your print home.", ages: "3–10" },
    { id: "pottery",   name: "Pottery Studio",      x: 4, y: 2, w: 1, h: 2, z: 48, c: "z1", info: "Clay wheels sized for small hands. Pieces are fired and collected later.", ages: "4–10" },
    { id: "playscape", name: "Playscape",           x: 5, y: 2, w: 2, h: 2, z: 70, c: "z2",   info: "The climbing, sliding, hiding heart of the museum. Socks on!", ages: "1–8" },
    { id: "water",     name: "Water Lab",           x: 0, y: 4, w: 2, h: 1, z: 34, c: "z3",    info: "Pumps, dams and boats. Waterproof smocks at the door.", ages: "1–7" },
    { id: "sound",     name: "Sight & Sound Lab",   x: 2, y: 4, w: 3, h: 1, z: 46, c: "z1",  info: "Tubes, chimes, echoes and a whisper wall.", ages: "2–10" },
    { id: "party",     name: "Party Room",          x: 5, y: 4, w: 2, h: 1, z: 40, c: "z4",   info: "Private space for birthdays and group bookings.", ages: "all" },
    { id: "cafe",      name: "Café & Rest",         x: 3, y: 5, w: 2, h: 1, z: 26, c: "z4",  info: "Snacks, coffee, a quiet corner and nursing room.", ages: "adults too" },
    { id: "wc",        name: "Restrooms",           x: 5, y: 5, w: 2, h: 1, z: 20, c: "z4",  info: "Family restrooms with changing tables." },
  ];
  const COLS = 7, ROWS = 6, U = 84; // unit size in px

  const floor = root.querySelector(".mm-floor");
  const panel = root.querySelector(".mm-panel");
  const tip = root.querySelector(".mm-tip");
  floor.style.width = COLS * U + "px";
  floor.style.height = ROWS * U + "px";

  // grid lines
  const grid = document.createElement("div"); grid.className = "mm-grid"; floor.appendChild(grid);

  const blocks = ZONES.map((z) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "mm-block mm-" + z.c; b.dataset.id = z.id;
    b.style.setProperty("--x", z.x * U + "px"); b.style.setProperty("--y", z.y * U + "px");
    b.style.setProperty("--w", z.w * U - 8 + "px"); b.style.setProperty("--h", z.h * U - 8 + "px");
    b.style.setProperty("--z", z.z + "px");
    b.innerHTML = `<span class="mm-top"><span class="mm-label">${z.name}</span></span><span class="mm-side mm-side--l"></span><span class="mm-side mm-side--r"></span>`;
    b.setAttribute("aria-label", z.name);
    floor.appendChild(b);
    b.addEventListener("click", () => select(z, b));
    b.addEventListener("pointerenter", (e) => showTip(z, e));
    b.addEventListener("pointermove", (e) => moveTip(e));
    b.addEventListener("pointerleave", hideTip);
    return b;
  });

  function showTip(z, e) { tip.textContent = z.name + (z.ages ? " · ages " + z.ages : ""); tip.hidden = false; moveTip(e); }
  function moveTip(e) { const r = root.getBoundingClientRect(); tip.style.left = e.clientX - r.left + 14 + "px"; tip.style.top = e.clientY - r.top - 10 + "px"; }
  function hideTip() { tip.hidden = true; }

  function select(z, b) {
    blocks.forEach((x) => x.classList.toggle("is-selected", x === b));
    panel.innerHTML = `
      <span class="tag">${z.ages ? "Ages " + z.ages : "Facilities"}</span>
      <h3>${z.name}</h3>
      <p>${z.info}</p>
      <p><a class="btn btn--small btn--coral" href="tickets.html" data-sheet="tickets">Get tickets</a>${z.id === "party" ? ' <a class="btn btn--small btn--soft" href="parties.html" data-sheet="parties">Book a party</a>' : ""}</p>`;
    panel.classList.add("is-live");
  }

  // ---- rotation (drag or buttons) ----
  let rotZ = -32, rotX = 56, dragging = false, sx = 0, sy = 0, rz0 = 0, rx0 = 0;
  const stage = root.querySelector(".mm-stage");
  const applyRot = () => { floor.style.transform = `rotateX(${rotX}deg) rotateZ(${rotZ}deg)`; root.style.setProperty("--rz", -rotZ + "deg"); };
  applyRot();
  stage.addEventListener("pointerdown", (e) => { if (e.target.closest(".mm-block")) return; dragging = true; sx = e.clientX; sy = e.clientY; rz0 = rotZ; rx0 = rotX; stage.setPointerCapture(e.pointerId); stage.classList.add("is-dragging"); });
  stage.addEventListener("pointermove", (e) => { if (!dragging) return; rotZ = rz0 + (e.clientX - sx) * 0.4; rotX = Math.max(30, Math.min(75, rx0 - (e.clientY - sy) * 0.25)); applyRot(); });
  const stop = () => { dragging = false; stage.classList.remove("is-dragging"); };
  stage.addEventListener("pointerup", stop); stage.addEventListener("pointercancel", stop);
  section.querySelector("[data-rot-l]").addEventListener("click", () => { rotZ -= 30; applyRot(); });
  section.querySelector("[data-rot-r]").addEventListener("click", () => { rotZ += 30; applyRot(); });
  section.querySelector("[data-rot-reset]").addEventListener("click", () => { rotZ = -32; rotX = 56; applyRot(); });
  section.querySelector("[data-top]").addEventListener("click", () => { rotX = 0; rotZ = 0; applyRot(); });

  // legend filter: hover a legend chip to spotlight its zones
  section.querySelectorAll("[data-legend]").forEach((chip) => {
    chip.addEventListener("pointerenter", () => blocks.forEach((b) => b.classList.toggle("is-dim", !b.classList.contains("mm-" + chip.dataset.legend))));
    chip.addEventListener("pointerleave", () => blocks.forEach((b) => b.classList.remove("is-dim")));
  });

  // deep-link: #zone=playscape
  const m = location.hash.match(/zone=([a-z]+)/);
  if (m) { const z = ZONES.find((x) => x.id === m[1]); if (z) select(z, blocks[ZONES.indexOf(z)]); }
})();
