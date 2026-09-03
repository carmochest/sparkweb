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
  const MODES = ["sunny", "cloudy", "rain", "storm", "mist", "night"];
  const LABEL = { sunny: "Perfect & sunny", cloudy: "Soft clouds", rain: "Rainy", storm: "Thunderstorm", mist: "Hazy & warm", night: "Clear night" };
  const ICON = { sunny: "☀", cloudy: "☁", rain: "☂", storm: "⚡", mist: "≋", night: "☾" };
  const DEMO_SEQ = ["sunny", "cloudy", "rain", "storm", "mist", "night"];
  const DEMO_STEP = 7000, FADE = 1400;

  // ---- canvas ----
  const cv = document.createElement("canvas"); cv.className = "wx-canvas"; cv.setAttribute("aria-hidden", "true");
  stage.insertBefore(cv, stage.firstChild);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0;
  function resize() { const dpr = Math.min(2, window.devicePixelRatio || 1); W = stage.clientWidth; H = stage.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); window.addEventListener("resize", resize);
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---- layers (current + fading previous) ----
  function makeLayer(mode) {
    const n = { sunny: 28, cloudy: 7, rain: 150, storm: 200, mist: 6, night: 80 }[mode];
    const L = { mode, alpha: 0, parts: [], glass: [] };
    for (let i = 0; i < n; i++) L.parts.push(spawn(mode, true));
    if (mode === "rain" || mode === "storm") for (let i = 0; i < 14; i++) L.glass.push(spawnGlass(true));
    return L;
  }
  function spawn(m, anywhere) {
    switch (m) {
      case "sunny": return { x: rnd(0, W), y: anywhere ? rnd(0, H) : H + 10, r: rnd(1.2, 3.4), vy: -rnd(6, 16), vx: rnd(-4, 4), a: rnd(0.15, 0.5), ph: rnd(0, 6.28) };
      case "cloudy": case "mist": return { x: anywhere ? rnd(-200, W) : -340, y: rnd(H * 0.04, H * 0.55), w: rnd(240, 440), h: rnd(60, 120), vx: rnd(6, 14), a: m === "mist" ? rnd(0.10, 0.18) : rnd(0.18, 0.32) };
      case "rain": case "storm": return { x: rnd(-60, W + 60), y: anywhere ? rnd(-H, H) : rnd(-80, -10), len: rnd(12, 26), vy: rnd(460, 700) * (m === "storm" ? 1.3 : 1), vx: m === "storm" ? -110 : -40, a: rnd(0.14, 0.3) };
      case "night": return { x: rnd(0, W), y: rnd(0, H * 0.7), r: rnd(0.6, 1.9), ph: rnd(0, 6.28), sp: rnd(0.6, 1.6) };
    }
  }
  // droplets "on the glass": appear, wobble, slide down and streak
  function spawnGlass(anywhere) { return { x: rnd(20, W - 20), y: anywhere ? rnd(0, H) : rnd(-20, H * 0.3), r: rnd(3, 8), vy: rnd(8, 26), wob: rnd(0, 6.28), life: rnd(4, 9), age: anywhere ? rnd(0, 4) : 0 }; }

  let cur = null, prev = null, flash = 0, t0 = performance.now();

  function drawLayer(L, now, dt, k) {   // k = alpha multiplier 0..1
    if (k <= 0) return;
    const m = L.mode;
    ctx.save(); ctx.globalAlpha = k;
    if (m === "sunny") {
      const p = 0.5 + 0.5 * Math.sin(now / 2600);
      let g = ctx.createRadialGradient(W * 0.86, H * 0.08, 10, W * 0.86, H * 0.08, W * (0.42 + 0.04 * p));
      g.addColorStop(0, "rgba(255, 210, 120, 0.6)"); g.addColorStop(0.35, "rgba(255, 224, 150, 0.24)"); g.addColorStop(1, "rgba(255, 232, 170, 0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      g = ctx.createRadialGradient(W * 0.2, H * 0.95, 10, W * 0.2, H * 0.95, W * 0.6);   // fresh green from below — "perfect weather"
      g.addColorStop(0, "rgba(170, 215, 160, 0.35)"); g.addColorStop(1, "rgba(170, 215, 160, 0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W * 0.86, H * 0.08); ctx.rotate(now / 90000);
      for (let i = 0; i < 7; i++) { ctx.rotate(Math.PI * 2 / 7); ctx.fillStyle = "rgba(255, 225, 160, 0.06)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, -40); ctx.lineTo(W, 40); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      L.parts.forEach((s, i) => { s.y += s.vy * dt; s.x += (s.vx + Math.sin(now / 900 + s.ph) * 6) * dt; if (s.y < -10) L.parts[i] = spawn("sunny", false);
        ctx.fillStyle = `rgba(255, 190, 90, ${s.a * (0.6 + 0.4 * Math.sin(now / 500 + s.ph))})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill(); });
    } else if (m === "cloudy" || m === "mist") {
      L.parts.forEach((c, i) => { c.x += c.vx * dt; if (c.x - c.w > W) L.parts[i] = spawn(m, false);
        const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.w * 0.6); g.addColorStop(0, `rgba(255,255,255,${c.a})`); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.save(); ctx.scale(1, c.h / c.w); ctx.beginPath(); ctx.arc(c.x, c.y * (c.w / c.h), c.w * 0.6, 0, 6.28); ctx.fill(); ctx.restore(); });
      if (m === "mist") { ctx.fillStyle = "rgba(240, 226, 200, 0.14)"; ctx.fillRect(0, 0, W, H); }
    } else if (m === "rain" || m === "storm") {
      ctx.lineWidth = 1.2; ctx.lineCap = "round";
      L.parts.forEach((d, i) => { d.y += d.vy * dt; d.x += d.vx * dt; if (d.y > H + 20) L.parts[i] = spawn(m, false);
        ctx.strokeStyle = `rgba(96, 63, 91, ${d.a})`; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.vx * 0.03, d.y - d.len); ctx.stroke(); });
      L.glass.forEach((g, i) => {
        g.age += dt; g.y += g.vy * dt * (0.6 + 0.4 * Math.sin(now / 700 + g.wob)); g.x += Math.sin(now / 500 + g.wob) * 4 * dt;
        if (g.age > g.life || g.y > H + 20) { L.glass[i] = spawnGlass(false); return; }
        const fade = Math.min(1, g.age / 0.6) * Math.min(1, (g.life - g.age) / 0.8);
        const rg = ctx.createRadialGradient(g.x - g.r * 0.35, g.y - g.r * 0.35, 0.5, g.x, g.y, g.r);
        rg.addColorStop(0, `rgba(255,255,255,${0.75 * fade})`); rg.addColorStop(0.5, `rgba(200, 190, 205, ${0.35 * fade})`); rg.addColorStop(1, `rgba(96, 63, 91, ${0.12 * fade})`);
        ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r, g.r * 1.25, 0, 0, 6.28); ctx.fill();
        ctx.strokeStyle = `rgba(96, 63, 91, ${0.10 * fade})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(g.x, g.y - g.r); ctx.lineTo(g.x, g.y - g.r - g.vy * 0.9); ctx.stroke();  // streak behind
      });
      if (m === "storm") { if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); flash -= dt * 3; } else if (Math.random() < dt * 0.14) flash = 1; }
    } else if (m === "night") {
      L.parts.forEach((s) => { const tw = 0.35 + 0.65 * Math.abs(Math.sin(now / 1000 * s.sp + s.ph)); ctx.fillStyle = `rgba(255, 245, 220, ${0.75 * tw})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * tw, 0, 6.28); ctx.fill(); });
      const g = ctx.createRadialGradient(W * 0.84, H * 0.12, 6, W * 0.84, H * 0.12, 130); g.addColorStop(0, "rgba(255, 246, 220, 0.55)"); g.addColorStop(1, "rgba(255, 246, 220, 0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
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
      : "Demo: a whole day in 40 seconds";
    const src = source === "live" ? `Live via Open-Meteo${updated ? " · updated " + updated : ""}` : "Auto-cycling for reference";
    card.innerHTML = `
      <div class="wx-top"><span class="wx-ico">${ICON[mode]}</span><div><b>${LABEL[mode]}</b><span>${meta}</span></div></div>
      <div class="wx-seq" aria-hidden="true">${seq}</div>
      <div class="wx-foot"><span>${src}</span>
        <span class="wx-switch"><button type="button" class="${source === "demo" ? "is-on" : ""}" data-wx="demo">Demo</button><button type="button" class="${source === "live" ? "is-on" : ""}" data-wx="live">Live</button></span>
      </div>`;
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
  function codeToMode(code, isDay) { if (!isDay && code <= 2) return "night"; if (code <= 1) return "sunny"; if (code <= 3) return "cloudy"; if (code <= 48) return "mist"; if (code >= 95) return "storm"; if (code >= 51) return "rain"; return "cloudy"; }
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
