/* Spark Play Museum — shared behaviour */

// Mobile nav
document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".nav-toggle");
  if (toggle) {
    const links = document.querySelector(".nav-links");
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
});

// Mark current page in nav
(() => {
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
  });
})();

/* ---------------- Spark transitions ----------------
   Every click on an internal link bursts one of the four brand spark
   marks at the cursor, veils the page, then navigates. Pages fade in on
   load. Honours prefers-reduced-motion (instant navigation). */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let sparkIndex = Math.floor(Math.random() * 4);

/* Burst = the next brand mark drawing itself at (x, y): rays shoot out from
   the centre, lightning zig-zags down, the star traces around. No spin. */
function sparkBurst(x, y, big) {
  if (!window.SparkDraw) return null;
  const n = 1 + sparkIndex; sparkIndex = (sparkIndex + 1) % 4;
  const mark = window.SparkDraw.create(n);
  const box = document.createElement("div");
  box.className = "spark-burst" + (big ? " spark-burst--big" : "");
  box.style.left = x + "px"; box.style.top = y + "px";
  box.appendChild(mark.svg);
  document.body.appendChild(box);
  window.SparkDraw.draw(mark, big ? 560 : 420, () => {
    setTimeout(() => { box.classList.add("is-fading"); setTimeout(() => box.remove(), 320); }, big ? 260 : 160);
  });
  return box;
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
  if (a.target === "_blank" || /^https?:\/\//i.test(href) || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  if (reduceMotion) return;
  e.preventDefault();
  sparkBurst(e.clientX, e.clientY, true);
  document.body.classList.add("page-leaving");
  setTimeout(() => { location.href = href; }, 520);
});

// Small burst on any button press too (forms still submit normally)
document.addEventListener("pointerdown", (e) => {
  if (reduceMotion) return;
  const b = e.target.closest("button, .btn, .zone, .card--link");
  if (b && !e.target.closest("a[href]")) sparkBurst(e.clientX, e.clientY, false);
});

// Logo: the four marks take turns drawing themselves in the "A" of SPARK —
// drawn on, held, then un-drawn (pen retracts) before the next one starts.
(() => {
  const stack = document.querySelector(".logo-stack");
  if (!stack || !window.SparkDraw || !window.SPARK_MARKS) return;
  const slots = [...stack.querySelectorAll(".logo-spark")];
  const marks = slots.map((slot, k) => {
    const n = k + 1, b = window.SPARK_MARKS[n].box;
    slot.style.left = b.left + "%"; slot.style.top = b.top + "%"; slot.style.width = b.width + "%"; slot.style.height = b.height + "%";
    const m = window.SparkDraw.create(n);
    m.svg.setAttribute("preserveAspectRatio", "none");
    m.svg.style.opacity = "0";
    slot.appendChild(m.svg);
    return m;
  });
  let i = 0, busy = false;
  window.SparkDraw.draw(marks[0]);
  const next = () => {
    if (busy) return; busy = true;
    window.SparkDraw.undraw(marks[i], 420, () => {
      i = (i + 1) % marks.length;
      setTimeout(() => window.SparkDraw.draw(marks[i], undefined, () => { busy = false; }), 120);
    });
  };
  if (!reduceMotion) setInterval(next, 3400);
  const brand = stack.closest(".brand");
  brand.addEventListener("pointerenter", () => { if (!reduceMotion) next(); });
  brand.addEventListener("pointerdown", () => {
    if (reduceMotion) return;
    const r = stack.getBoundingClientRect();
    for (let k = 0; k < 4; k++) setTimeout(() => sparkBurst(r.left + r.width * (0.15 + Math.random() * 0.7), r.top + r.height * (0.1 + Math.random() * 0.8), false), k * 90);
  });
})();

/* ---------------- Freeform button motion ----------------
   Every button gets its own random tilt, squish and bounce so no two
   hovers feel the same. */
(() => {
  document.querySelectorAll(".btn, .nav-links a, .tag, .card-more").forEach((b) => {
    const r = (Math.random() * 6 - 3).toFixed(2);
    const sx = (1.03 + Math.random() * 0.07).toFixed(3);
    const sy = (0.95 + Math.random() * 0.1).toFixed(3);
    const ty = (-(2 + Math.random() * 5)).toFixed(1);
    const dur = (0.45 + Math.random() * 0.35).toFixed(2);
    b.style.setProperty("--hr", r + "deg");
    b.style.setProperty("--hsx", sx);
    b.style.setProperty("--hsy", sy);
    b.style.setProperty("--hty", ty + "px");
    b.style.setProperty("--hdur", dur + "s");
  });
})();

/* ---------------- Drag engine ----------------
   Pointer-based dragging for "pile" widgets (zones, photos). Desktop-only
   (fine pointer + hover); on touch devices the pile stays a static grid so
   the page still scrolls. A press that barely moves counts as a click. */
const canDrag = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion;

function makePile(container, opts) {
  const items = [...container.children];
  let z = 10;
  const state = new Map();

  function layoutFromGrid() {
    // Freeze the current grid positions, then switch to absolute positioning.
    const rects = items.map((el) => el.getBoundingClientRect());
    const cr = container.getBoundingClientRect();
    container.style.height = cr.height + "px";
    container.classList.add("pile--free");
    items.forEach((el, k) => {
      const x = rects[k].left - cr.left, y = rects[k].top - cr.top;
      el.style.width = rects[k].width + "px";
      el.style.height = rects[k].height + "px";
      state.set(el, { x, y, r: opts.rotate ? opts.rotate() : 0, home: { x, y } });
      apply(el);
    });
  }
  function apply(el) {
    const st = state.get(el);
    el.style.transform = `translate(${st.x}px, ${st.y}px) rotate(${st.r}deg)`;
  }
  function reset() {
    items.forEach((el) => { const st = state.get(el); st.x = st.home.x; st.y = st.home.y; st.r = opts.rotate ? opts.rotate() : 0; el.style.zIndex = ""; el.classList.remove("is-open"); apply(el); });
    if (opts.onReset) opts.onReset(items);
  }

  items.forEach((el) => {
    el.draggable = false;
    el.addEventListener("dragstart", (e) => e.preventDefault());
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const st = state.get(el);
      const sx = e.clientX, sy = e.clientY, ox = st.x, oy = st.y;
      let moved = false;
      el.style.zIndex = ++z;
      el.classList.add("is-dragging");
      el.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moved && Math.hypot(dx, dy) > 4) moved = true;
        if (!moved) return;
        st.x = ox + dx; st.y = oy + dy;
        st.r += (ev.movementX || 0) * 0.08;               // a little swing while dragging
        st.r = Math.max(-18, Math.min(18, st.r));
        apply(el);
      };
      const up = (ev) => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        el.classList.remove("is-dragging");
        if (moved) {
          st.r = st.r * 0.6; apply(el);                     // settle
          el.dataset.justDragged = "1";
          setTimeout(() => delete el.dataset.justDragged, 50);
          if (opts.onDrop) opts.onDrop(el);
        }
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
    // swallow the click that follows a drag
    el.addEventListener("click", (e) => { if (el.dataset.justDragged) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  // Re-freeze on resize so the pile doesn't drift off-canvas.
  let t; window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { container.classList.remove("pile--free"); container.style.height = ""; items.forEach((el) => { el.style.transform = ""; el.style.width = ""; el.style.height = ""; }); layoutFromGrid(); }, 150); });

  layoutFromGrid();
  return { reset, items, state, apply };
}

// Zones pile (Our approach)
(() => {
  const c = document.querySelector("[data-drag-zones]");
  if (!c || !canDrag) return;
  const pile = makePile(c, { rotate: () => (Math.random() * 4 - 2) });
  const btn = document.querySelector("[data-reset-zones]");
  if (btn) btn.addEventListener("click", () => pile.reset());
})();

// Photo pile (Little moments) — random blob shapes, drag to stack, click to open
(() => {
  const c = document.querySelector("[data-photo-pile]");
  if (!c) return;
  const imgs = [...c.children];
  const blob = () => {
    const r = () => 35 + Math.round(Math.random() * 30);
    return `${r()}% ${100 - r()}% ${r()}% ${100 - r()}% / ${r()}% ${r()}% ${100 - r()}% ${100 - r()}%`;
  };
  const shapes = [blob, blob, () => "28px", () => "50%", () => "120px 120px 28px 28px", () => "28px 120px 28px 120px", blob];
  const shuffleShapes = () => imgs.forEach((im) => { im.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)](); });
  shuffleShapes();

  let open = null, pile = null;
  const closeOpen = () => { if (open) { open.classList.remove("is-open"); open = null; c.classList.remove("has-open"); } };
  imgs.forEach((im) => im.addEventListener("click", () => {
    if (im.dataset.justDragged) return;
    if (open === im) { closeOpen(); return; }
    closeOpen(); open = im; im.classList.add("is-open"); c.classList.add("has-open");
    if (pile) {
      // open in the middle of the pile, as big as fits
      const cw = c.clientWidth, ch = c.clientHeight, w = im.offsetWidth, h = im.offsetHeight;
      const sc = Math.min(2.4, (ch * 0.98) / h, (cw * 0.6) / w);
      im.style.setProperty("--open-transform", `translate(${(cw - w) / 2}px, ${(ch - h) / 2}px) rotate(0deg) scale(${sc.toFixed(3)})`);
    }
    im.style.zIndex = 500;
    if (!reduceMotion) { const r = im.getBoundingClientRect(); sparkBurst(r.left + r.width / 2, r.top + r.height / 2, true); }
  }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeOpen(); });

  const shuffleBtn = document.querySelector("[data-shuffle-pile]");
  if (canDrag) {
    pile = makePile(c, { rotate: () => (Math.random() * 14 - 7), onDrop: () => {} });
    if (shuffleBtn) shuffleBtn.addEventListener("click", () => {
      closeOpen(); shuffleShapes();
      // scatter: random offsets around home positions
      pile.items.forEach((el) => { const st = pile.state.get(el); st.x = st.home.x + (Math.random() * 60 - 30); st.y = st.home.y + (Math.random() * 40 - 20); st.r = Math.random() * 16 - 8; el.style.zIndex = 10 + Math.floor(Math.random() * 9); pile.apply(el); });
    });
  } else if (shuffleBtn) {
    shuffleBtn.addEventListener("click", shuffleShapes);
  }
})();

// Page enters
window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-leaving");
  document.body.classList.add("page-ready");
});

/* ---------------- Build Your Visit (tickets.html) ----------------
   Date-first flow: pick a visit date, see date-tied add-on events,
   everything joins one cart, one combined checkout.
   Pricing here is sample data; production values sync from Odoo.  */

const BYV = {
  weekdayPrice: 450,
  weekendPrice: 590,
  vatNote: "Prices include 7% VAT",
  addons: [
    { id: "dots", title: "Party Lab: Infinite Dots", cat: "Workshop", ages: "1–5", dur: "90 min", days: [6], time: "Sat 10:30–12:00", price: 300 },
    { id: "squishy", title: "Dough Lab: Squishy Friends", cat: "Workshop", ages: "1–5", dur: "90 min", days: [0], time: "Sun 10:30–12:00", price: 300 },
    { id: "candy", title: "Dough Lab: Magic Candy Shop", cat: "Workshop", ages: "1–5", dur: "90 min", days: [0], time: "Sun 10:30–12:00", price: 300 },
    { id: "playdots", title: "Play Lab: Dots Are All Around!", cat: "Playgroup", ages: "1–3", dur: "90 min", days: [2, 3, 4, 5], time: "Tue–Fri 10:00–11:30", price: 0 },
    { id: "story", title: "Storytelling Circle", cat: "Storytelling", ages: "2–6", dur: "30 min", days: [0, 1, 2, 3, 4, 5, 6], time: "Daily 15:00", price: 0 }
  ]
};

const byvState = { date: null, tickets: 1, addons: {} };

function byvInit() {
  const dateInput = document.getElementById("byv-date");
  if (!dateInput) return;
  const today = new Date();
  dateInput.min = today.toISOString().slice(0, 10);
  dateInput.addEventListener("change", () => {
    byvState.date = dateInput.value ? new Date(dateInput.value + "T00:00:00") : null;
    byvState.addons = {};
    byvRenderAddons();
    byvRenderCart();
  });
  document.getElementById("byv-tickets").addEventListener("change", (e) => {
    byvState.tickets = Math.max(1, parseInt(e.target.value, 10) || 1);
    byvRenderCart();
  });
}

function byvIsWeekend(d) { return d.getDay() === 0 || d.getDay() === 6; }

function byvRenderAddons() {
  const box = document.getElementById("byv-addons");
  const hint = document.getElementById("byv-addon-hint");
  box.innerHTML = "";
  if (!byvState.date) {
    hint.textContent = "Pick a visit date first — we’ll show what’s on that day.";
    return;
  }
  const day = byvState.date.getDay();
  const avail = BYV.addons.filter((a) => a.days.includes(day));
  hint.textContent = avail.length
    ? "Happening on your visit date — add any to your ticket:"
    : "No add-on events on this date. Your entry ticket covers all zones!";
  avail.forEach((a) => {
    const el = document.createElement("div");
    el.className = "card addon-card";
    el.innerHTML =
      '<div><span class="tag tag--blue">' + a.cat + "</span>" +
      "<h3>" + a.title + "</h3>" +
      '<p class="small muted">Ages ' + a.ages + " · " + a.dur + " · " + a.time + "</p></div>" +
      '<div style="text-align:right"><div class="price-note">' +
      (a.price ? a.price + " THB" : "Free with ticket") + "</div>" +
      '<button class="btn btn--small" data-addon="' + a.id + '">' +
      (byvState.addons[a.id] ? "Remove" : "Add to Visit") + "</button></div>";
    box.appendChild(el);
  });
  box.querySelectorAll("[data-addon]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.addon;
      if (byvState.addons[id]) delete byvState.addons[id];
      else byvState.addons[id] = true;
      byvRenderAddons();
      byvRenderCart();
    });
  });
}

function byvRenderCart() {
  const box = document.getElementById("byv-cart");
  const btn = document.getElementById("byv-checkout");
  if (!byvState.date) {
    box.innerHTML = '<p class="muted">Your cart is empty. Choose a visit date to begin.</p>';
    btn.disabled = true;
    return;
  }
  const weekend = byvIsWeekend(byvState.date);
  const unit = weekend ? BYV.weekendPrice : BYV.weekdayPrice;
  const dateStr = byvState.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  let total = unit * byvState.tickets;
  let html =
    '<div class="cart-line"><span>Day Pass × ' + byvState.tickets +
    '<br><span class="small muted">' + dateStr + " · " + (weekend ? "weekend" : "weekday") + " rate</span></span>" +
    "<span>" + unit * byvState.tickets + " THB</span></div>";
  Object.keys(byvState.addons).forEach((id) => {
    const a = BYV.addons.find((x) => x.id === id);
    total += a.price;
    html +=
      '<div class="cart-line"><span>' + a.title + '<br><span class="small muted">' + a.time + "</span></span><span>" +
      (a.price ? a.price + " THB" : "Free") + "</span></div>";
  });
  html += '<div class="cart-total"><span>Total</span><span>' + total + " THB</span></div>" +
    '<p class="small muted">' + BYV.vatNote + ". Your selected date appears on your e-ticket and receipt.</p>";
  box.innerHTML = html;
  btn.disabled = false;
}

document.addEventListener("DOMContentLoaded", byvInit);
