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
const SPARKS = ["assets/spark-icon.svg", "assets/spark-doodle-2.svg", "assets/spark-doodle-3.svg", "assets/spark-doodle-4.svg"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let sparkIndex = Math.floor(Math.random() * SPARKS.length);

function sparkBurst(x, y, big) {
  const el = document.createElement("img");
  el.src = SPARKS[sparkIndex];
  sparkIndex = (sparkIndex + 1) % SPARKS.length;
  el.className = "spark-burst" + (big ? " spark-burst--big" : "");
  el.alt = "";
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.setProperty("--spin", (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 180) + "deg");
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
  return el;
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

// Logo: cycle the spark on a timer; a click showers sparks
(() => {
  const stack = document.querySelector(".logo-stack");
  if (!stack) return;
  const sparks = stack.querySelectorAll(".logo-spark");
  let i = 0;
  sparks[0].classList.add("is-on");
  if (!reduceMotion) {
    setInterval(() => {
      sparks[i].classList.remove("is-on");
      i = (i + 1) % sparks.length;
      sparks[i].classList.add("is-on");
    }, 2200);
  }
  stack.closest(".brand").addEventListener("pointerdown", (e) => {
    if (reduceMotion) return;
    const r = stack.getBoundingClientRect();
    for (let k = 0; k < 4; k++) {
      setTimeout(() => sparkBurst(r.left + r.width * (0.25 + Math.random() * 0.5), r.top + r.height * (0.2 + Math.random() * 0.6), false), k * 70);
    }
  });
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
