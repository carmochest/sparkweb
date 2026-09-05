/* Spark Play Museum — one-page app behaviour
   Sheets (pop-up panels) replace page navigation on the front page; the nav
   gets a fluid sliding highlight and shrinks on scroll. */
(function () {
  const layer = document.querySelector("[data-sheet-layer]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sheets ---------- */
  let current = null, lastFocus = null;
  const sheetFor = (name) => document.getElementById("sheet-" + name);

  function openSheet(name, anchor) {
    const sh = sheetFor(name);
    if (!sh) return false;
    if (current && current !== sh) { current.hidden = true; current.classList.remove("is-in"); }
    lastFocus = document.activeElement;
    layer.hidden = false; sh.hidden = false; current = sh;
    document.body.classList.add("sheet-open");
    document.querySelectorAll(".menu-pill").forEach((b) => b.classList.toggle("is-active", b.dataset.sheet === name));
    const stage = document.querySelector("[data-stage]");
    if (stage && window.scrollY > 10) window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    void sh.offsetWidth;                                   // commit the hidden→shown state so the transition runs
    layer.classList.add("is-in"); sh.classList.add("is-in");
    sh.scrollTop = 0;
    document.dispatchEvent(new CustomEvent("spark:sheet", { detail: { name, anchor } }));
    if (anchor) { const t = sh.querySelector("#" + CSS.escape(anchor)); if (t) setTimeout(() => scrollSheetTo(sh, t), 250); }
    history.replaceState(null, "", "#" + name + (anchor ? "/" + anchor : ""));
    setTimeout(() => (sh.querySelector(".sheet-close") || sh).focus(), 300);
    return true;
  }
  // scroll inside the sheet (never the page) so the target lands under the sticky header
  function scrollSheetTo(sh, t) {
    const head = sh.querySelector(".sheet-head"); const pad = (head ? head.offsetHeight : 60) + 12;
    // measure after layout has settled (content above may have just expanded)
    const top = Math.max(0, Math.round(t.getBoundingClientRect().top - sh.getBoundingClientRect().top + sh.scrollTop - pad));
    animateScroll(sh, top);
    if (window.scrollY > 10) window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });   // the page itself stays put
  }
  // our own eased scroll: consistent across browsers, immune to native smooth-scroll quirks
  function animateScroll(el, to) {
    if (el._scrollAnim) cancelAnimationFrame(el._scrollAnim);
    const from = el.scrollTop, dist = to - from; if (reduce || Math.abs(dist) < 2) { el.scrollTop = to; return; }
    const dur = Math.min(650, 260 + Math.abs(dist) * 0.35), t0 = performance.now();
    const step = (now) => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.scrollTop = from + dist * e; if (p < 1) el._scrollAnim = requestAnimationFrame(step); else el._scrollAnim = null; };
    el._scrollAnim = requestAnimationFrame(step);
  }
  window.SparkScroll = scrollSheetTo;
  function closeSheet() {
    if (!current) return;
    const sh = current; current = null;
    layer.classList.remove("is-in"); sh.classList.remove("is-in");
    document.body.classList.remove("sheet-open");
    document.querySelectorAll(".menu-pill").forEach((b) => b.classList.remove("is-active"));
    setTimeout(() => { sh.hidden = true; layer.hidden = true; }, reduce ? 0 : 320);
    history.replaceState(null, "", location.pathname);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  window.SparkApp = { openSheet, closeSheet };

  if (layer) {
    // Anything that names a sheet opens it; links to page files map to their sheet.
    document.addEventListener("click", (e) => {
      const closeBtn = e.target.closest("[data-sheet-close]");
      if (closeBtn) { e.preventDefault(); closeSheet(); return; }
      const trigger = e.target.closest("[data-sheet], a[href]");
      if (!trigger) return;
      let name = trigger.dataset.sheet, anchor = null;
      if (!name && trigger.tagName === "A") {
        const href = trigger.getAttribute("href") || "";
        if (href.startsWith("#") && current && href.length > 1) {   // in-sheet anchor: scroll the sheet, keep the page still
          const t = current.querySelector(href); if (t) { e.preventDefault(); e.stopImmediatePropagation(); scrollSheetTo(current, t); return; }
        }
        const m = href.match(/^([a-z-]+)\.html(?:#([\w-]+))?$/i);
        if (!m) return;
        if (m[1] === "index") { e.preventDefault(); closeSheet(); return; }
        name = m[1]; anchor = m[2] || null;
      } else if (trigger.dataset.anchor) anchor = trigger.dataset.anchor;
      if (!sheetFor(name)) return;               // no sheet for it: let the link behave normally
      e.preventDefault(); e.stopImmediatePropagation();  // stop the page-transition handler
      openSheet(name, anchor);
    }, true);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
    // deep link: #tickets or #tickets/membership
    const m = location.hash.match(/^#([a-z-]+)(?:\/([\w-]+))?$/);
    if (m && sheetFor(m[1])) setTimeout(() => openSheet(m[1], m[2]), 200);
    window.addEventListener("hashchange", () => {
      const h = location.hash.match(/^#([a-z-]+)(?:\/([\w-]+))?$/);
      if (h && sheetFor(h[1])) openSheet(h[1], h[2]); else if (!location.hash) closeSheet();
    });
  }

  /* ---------- Nav: sliding highlight + shrink on scroll ---------- */
  const nav = document.querySelector(".nav");
  const links = document.querySelector(".nav-links");
  if (nav && links) {
    const glow = document.createElement("span"); glow.className = "nav-glow"; links.appendChild(glow);
    const active = () => links.querySelector('a[aria-current="page"]');
    const moveTo = (a) => {
      if (!a) { glow.style.opacity = "0"; return; }
      const r = a.getBoundingClientRect(), pr = links.getBoundingClientRect();
      glow.style.opacity = "1"; glow.style.width = r.width + "px"; glow.style.transform = `translateX(${r.left - pr.left}px)`;
    };
    links.querySelectorAll("a").forEach((a) => a.addEventListener("pointerenter", () => moveTo(a)));
    links.addEventListener("pointerleave", () => moveTo(active()));
    window.addEventListener("resize", () => moveTo(active()));
    setTimeout(() => moveTo(active()), 50);
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { document.body.classList.toggle("is-scrolled", window.scrollY > 40); ticking = false; });
    }, { passive: true });
  }

  /* ---------- Mobile menu (hamburger) ---------- */
  const navEl = document.querySelector(".nav"), burger = document.querySelector("[data-nav-toggle]");
  if (navEl && burger) {
    const setMenu = (open) => { navEl.classList.toggle("menu-open", open); burger.setAttribute("aria-expanded", String(open)); };
    burger.addEventListener("click", (e) => { e.stopPropagation(); setMenu(!navEl.classList.contains("menu-open")); });
    document.addEventListener("click", (e) => { if (navEl.classList.contains("menu-open") && !e.target.closest(".nav-links")) setMenu(false); });
    navEl.querySelectorAll(".nav-links a, .btn--hot").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });
  }
})();
