/* Spark Play Museum — weather ambience behind the museum map
   Six moods (perfect sunny, cloudy, rainy, thunderstorm, hazy, clear night)
   drawn on a canvas layer, crossfading between each other. Two sources:
     • DEMO  — auto-cycles through a day (default for now, for reference)
     • LIVE  — Open-Meteo forecast for Bangkok (free, no API key), 15-min refresh
   The weather card (left) shows what's on, the source, and lets you switch.
   ?weather=rain forces a mood; ?weather=live starts on the live feed. */
(function () {
  const stage = document.querySelector(".mm--full .mm-stage");
  if (!stage) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MODES = ["sunny", "cloudy", "rain", "night"];
  const LABEL = { sunny: "Perfect & sunny", cloudy: "Soft clouds", rain: "Rainy", storm: "Thunderstorm", mist: "Hazy & warm", night: "Clear night" };
  const ICON = { sunny: "☀", cloudy: "☁", rain: "☂", storm: "⚡", mist: "≋", night: "☾" };
  const DEMO_SEQ = ["sunny", "cloudy", "rain", "night"];
  const DEMO_STEP = 7000, FADE = 1400;

  // ---- canvas ----
  const cv = document.createElement("canvas"); cv.className = "wx-canvas"; cv.setAttribute("aria-hidden", "true");
  stage.insertBefore(cv, stage.firstChild);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  function resize() { const dpr = Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1); W = stage.clientWidth; H = stage.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); window.addEventListener("resize", resize);
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---- layers (current + fading previous) ----
  function makeLayer(mode) {
    const n = { sunny: coarse ? 14 : 24, cloudy: coarse ? 4 : 6, rain: coarse ? 80 : 140, storm: 160, mist: 5, night: coarse ? 50 : 80 }[mode];
    const L = { mode, alpha: 0, parts: [], flocks: [], nextFlock: performance.now() + rnd(1500, 4000) };
    for (let i = 0; i < n; i++) L.parts.push(spawn(mode, true));
    return L;
  }
  function spawn(m, anywhere) {
    switch (m) {
      case "sunny": return { x: rnd(0, W), y: anywhere ? rnd(0, H) : H + 10, r: rnd(1.2, 3.4), vy: -rnd(6, 16), vx: rnd(-4, 4), a: rnd(0.15, 0.5), ph: rnd(0, 6.28) };
      case "cloudy": case "mist": { const w = rnd(320, 620); return { x: anywhere ? rnd(-200, W) : -w - 40, y: rnd(H * 0.05, H * 0.5), w, vx: rnd(5, 11), a: rnd(0.22, 0.4), h: rnd(0.28, 0.42) }; }
      case "rain": case "storm": return { x: rnd(-60, W + 60), y: anywhere ? rnd(-H, H) : rnd(-80, -10), len: rnd(12, 26), vy: rnd(460, 700) * (m === "storm" ? 1.3 : 1), vx: m === "storm" ? -110 : -40, a: rnd(0.14, 0.3) };
      case "night": return { x: rnd(0, W), y: rnd(0, H * 0.7), r: rnd(0.6, 1.9), ph: rnd(0, 6.28), sp: rnd(0.6, 1.6) };
    }
  }
  // cartoon cloud: a row of overlapping puffs on a flat base
  function makePuffs(w) { const big = rnd(0.19, 0.23), side = rnd(0.12, 0.15), off = rnd(0.2, 0.24); return [{ dx: -w * off, r: w * side }, { dx: rnd(-0.04, 0.04) * w, r: w * big }, { dx: w * off, r: w * side }]; }
  // a small flock of birds crossing the sky
  function spawnFlock() { const dir = Math.random() < 0.7 ? 1 : -1, n = 3 + Math.floor(rnd(0, 4)), s = rnd(0.7, 1.15); const f = { x: dir > 0 ? -60 : W + 60, y: rnd(H * 0.06, H * 0.38), vx: dir * rnd(55, 95), vy: rnd(-6, 6), s, birds: [] };
    for (let i = 0; i < n; i++) f.birds.push({ dx: -i * 16 * dir + rnd(-4, 4), dy: Math.abs(i) * 7 * (i % 2 ? 1 : -1) + rnd(-3, 3), ph: rnd(0, 6.28), sp: rnd(8, 12) }); return f; }
  function drawBird(x, y, s, flap, dir) { ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.lineWidth = 1.6; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(96, 63, 91, 0.7)";
    ctx.beginPath(); ctx.moveTo(-7, flap * 3); ctx.quadraticCurveTo(-3, -2 - flap * 2, 0, 0); ctx.quadraticCurveTo(3, -2 - flap * 2, 7, flap * 3); ctx.stroke(); ctx.restore(); }

  let cur = null, prev = null, flash = 0, t0 = performance.now();

  function drawLayer(L, now, dt, k) {   // k = alpha multiplier 0..1
    if (k <= 0) return;
    const m = L.mode;
    ctx.save(); ctx.globalAlpha = k;
    if (m === "sunny") {
      if (!coarse) {   // slow sun rays (desktop only — the glow itself is CSS, painted once)
        ctx.save(); ctx.translate(W * 0.86, H * 0.08); ctx.rotate(now / 90000);
        for (let i = 0; i < 7; i++) { ctx.rotate(Math.PI * 2 / 7); ctx.fillStyle = "rgba(255, 225, 160, 0.06)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, -40); ctx.lineTo(W, 40); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      }
      L.parts.forEach((s, i) => { s.y += s.vy * dt; s.x += (s.vx + Math.sin(now / 900 + s.ph) * 6) * dt; if (s.y < -10) L.parts[i] = spawn("sunny", false);
        ctx.fillStyle = `rgba(255, 190, 90, ${s.a * (0.6 + 0.4 * Math.sin(now / 500 + s.ph))})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill(); });
      // occasional birds
      if (now > L.nextFlock && k > 0.5) { L.flocks.push(spawnFlock()); L.nextFlock = now + rnd(7000, 15000); }
      L.flocks = L.flocks.filter((f) => f.vx > 0 ? f.x < W + 160 : f.x > -160);
      L.flocks.forEach((f) => { f.x += f.vx * dt; f.y += (f.vy + Math.sin(now / 1400) * 4) * dt;
        f.birds.forEach((b) => drawBird(f.x + b.dx, f.y + b.dy + Math.sin(now / 600 + b.ph) * 2, f.s, Math.sin(now / 1000 * b.sp + b.ph), f.vx > 0 ? 1 : -1)); });
    } else if (m === "cloudy" || m === "mist") {
      L.parts.forEach((c, i) => { c.x += c.vx * dt; if (c.x - c.w > W + 40) L.parts[i] = spawn(m, false);
        // soft haze: a wide radial gradient, squashed — blends into the sky like a watercolour wash
        const rx = c.w * 0.5, ry = rx * c.h;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rx);
        g.addColorStop(0, `rgba(255,255,255,${c.a})`); g.addColorStop(0.55, `rgba(255,255,255,${c.a * 0.5})`); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.save(); ctx.translate(c.x, c.y); ctx.scale(1, c.h); ctx.translate(-c.x, -c.y); ctx.beginPath(); ctx.arc(c.x, c.y, rx, 0, 6.28); ctx.fill(); ctx.restore(); void ry; });
      if (m === "mist") { ctx.fillStyle = "rgba(240, 226, 200, 0.14)"; ctx.fillRect(0, 0, W, H); }
    } else if (m === "rain" || m === "storm") {
      ctx.lineWidth = 1.3; ctx.lineCap = "round";

      L.parts.forEach((d, i) => { d.y += d.vy * dt; d.x += d.vx * dt; if (d.y > H + 20) L.parts[i] = spawn(m, false);
        ctx.strokeStyle = `rgba(96, 63, 91, ${d.a})`; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.vx * 0.03, d.y - d.len); ctx.stroke(); });
      if (m === "storm") { if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); flash -= dt * 3; } else if (Math.random() < dt * 0.14) flash = 1; }
    } else if (m === "night") {
      L.parts.forEach((s) => { const tw = 0.35 + 0.65 * Math.abs(Math.sin(now / 1000 * s.sp + s.ph)); ctx.fillStyle = `rgba(255, 245, 220, ${0.75 * tw})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * tw, 0, 6.28); ctx.fill(); });

    }
    ctx.restore();
  }

  let tick = 0, visible = true, scrolling = 0;
  window.addEventListener("scroll", () => { scrolling = performance.now(); }, { passive: true });
  if ("IntersectionObserver" in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.02 }).observe(stage);
  function frame(now) {
    if (!visible) { t0 = now; setTimeout(() => requestAnimationFrame(frame), 400); return; }
    if (coarse && (tick++ % 2)) { requestAnimationFrame(frame); return; }   // ~30fps on phones
    if (coarse && now - scrolling < 160) { t0 = now; requestAnimationFrame(frame); return; }   // let the scroller have the frame
    const dt = Math.min(0.08, (now - t0) / 1000); t0 = now;
    ctx.clearRect(0, 0, W, H);
    if (cur) { cur.alpha = Math.min(1, cur.alpha + dt * 1000 / FADE); }
    if (prev) { prev.alpha = Math.max(0, prev.alpha - dt * 1000 / FADE); if (prev.alpha <= 0) prev = null; }
    if (prev) drawLayer(prev, now, dt, prev.alpha);
    if (cur) drawLayer(cur, now, dt, cur.alpha);
    if (!document.hidden && !reduce) requestAnimationFrame(frame); else setTimeout(() => requestAnimationFrame(frame), 900);
  }

  // ---- mood + card ----
  const card = document.createElement("div"); card.className = "wx-card"; stage.appendChild(card);
  let mode = null, source = "demo", temp = null, hum = null, updated = null, demoTimer = null, demoIdx = 0;

  function setMode(m) {
    if (m === mode) { renderCard(); return; }
    mode = m; prev = cur; cur = makeLayer(m);
    MODES.forEach((x) => stage.classList.toggle("wx-" + x, x === m));
    renderCard(true);
  }
  function renderCard(pop) {
    const seq = DEMO_SEQ.map((m) => `<i class="${m === mode ? "is-on" : ""}" title="${LABEL[m]}">${ICON[m]}</i>`).join("");
    const meta = source === "live"
      ? (temp != null ? `${Math.round(temp)}°C${hum != null ? " · " + hum + "% humidity" : ""} · Bangkok` : "Fetching Bangkok forecast…")
      : "Demo cycle";
    const src = source === "live" ? `Live via Open-Meteo${updated ? " · updated " + updated : ""}` : "Auto-cycling for reference";
    card.title = src;
    card.innerHTML = `
      <span class="wx-ico">${ICON[mode]}</span>
      <span class="wx-txt"><b>${LABEL[mode]}</b><span>${meta}</span></span>
      <span class="wx-seq" aria-hidden="true">${seq}</span>
      <span class="wx-switch"><button type="button" class="${source === "demo" ? "is-on" : ""}" data-wx="demo" title="Auto-cycle demo">Demo</button><button type="button" class="${source === "live" ? "is-on" : ""}" data-wx="live" title="Live Bangkok weather">Live</button></span>`;
    if (pop) { card.classList.remove("is-pop"); void card.offsetWidth; card.classList.add("is-pop"); }
  }

  // ---- demo cycle ----
  function startDemo(from) {
    stopDemo(); source = "demo"; stage.classList.add("wx-auto");
    demoIdx = from != null ? from : 0; setMode(DEMO_SEQ[demoIdx]);
    demoTimer = setInterval(() => { demoIdx = (demoIdx + 1) % DEMO_SEQ.length; setMode(DEMO_SEQ[demoIdx]); }, DEMO_STEP);
  }
  function stopDemo() { if (demoTimer) clearInterval(demoTimer); demoTimer = null; stage.classList.remove("wx-auto"); }

  // ---- live feed ----
  function codeToMode(code, isDay) { if (!isDay) return code >= 51 ? "rain" : "night"; if (code <= 1) return "sunny"; if (code <= 48) return "cloudy"; if (code >= 51) return "rain"; return "cloudy"; }
  async function fetchLive() {
    try {
      const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=13.7367&longitude=100.5834&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=Asia%2FBangkok", { cache: "no-store" });
      const j = await r.json(); temp = j.current.temperature_2m; hum = j.current.relative_humidity_2m;
      updated = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      return codeToMode(j.current.weather_code, j.current.is_day === 1);
    } catch (e) { const h = new Date().getHours(); return h >= 19 || h < 6 ? "night" : "sunny"; }
  }
  let liveTimer = null;
  function startLive() {
    stopDemo(); source = "live"; renderCard();
    fetchLive().then(setMode);
    if (liveTimer) clearInterval(liveTimer);
    liveTimer = setInterval(() => fetchLive().then(setMode), 15 * 60 * 1000);
  }

  card.addEventListener("click", (e) => {
    const b = e.target.closest("[data-wx]"); if (!b) return;
    if (b.dataset.wx === "live") { startLive(); } else { if (liveTimer) clearInterval(liveTimer); startDemo(0); }
  });
  card.addEventListener("click", (e) => {   // tap a mood dot to jump there (pauses the cycle on that mood)
    const i = e.target.closest(".wx-seq i"); if (!i) return;
    stopDemo(); if (liveTimer) clearInterval(liveTimer); source = "demo";
    setMode(DEMO_SEQ[[...i.parentElement.children].indexOf(i)]);
  });

  const forced = new URLSearchParams(location.search).get("weather");
  if (forced === "live") startLive();
  else if (forced && MODES.includes(forced)) { source = "demo"; setMode(forced); }
  else startDemo(0);
  requestAnimationFrame(frame);
})();
