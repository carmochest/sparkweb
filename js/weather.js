/* Spark Play Museum — live weather ambience
   A quiet animated layer behind the museum map that mirrors the real weather
   in Bangkok (Open-Meteo, no API key): sun glow and drifting sparkles when
   it's sunny, soft clouds, gentle rain, the odd lightning flash in a storm,
   stars at night. Deliberately subtle. Tap the weather badge to try the
   other moods; "live" snaps back to the forecast. ?weather=rain forces a mode. */
(function () {
  const stage = document.querySelector(".mm--full .mm-stage");
  if (!stage) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MODES = ["sunny", "cloudy", "rain", "storm", "night", "mist"];
  const LABEL = { sunny: "Hot & sunny", cloudy: "Cloudy", rain: "Rainy", storm: "Thunderstorm", night: "Clear night", mist: "Hazy" };
  const ICON = { sunny: "☀", cloudy: "☁", rain: "☂", storm: "⚡", night: "☾", mist: "≋" };

  // ---- canvas layer ----
  const cv = document.createElement("canvas"); cv.className = "wx-canvas"; cv.setAttribute("aria-hidden", "true");
  stage.insertBefore(cv, stage.firstChild);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); W = stage.clientWidth; H = stage.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); window.addEventListener("resize", resize);

  // ---- badge ----
  const badge = document.createElement("button");
  badge.type = "button"; badge.className = "wx-badge"; badge.setAttribute("aria-live", "polite");
  stage.appendChild(badge);

  let mode = "sunny", live = true, temp = null, particles = [], flash = 0, t0 = performance.now();
  const rnd = (a, b) => a + Math.random() * (b - a);

  function setMode(m, opts) {
    mode = m;
    MODES.forEach((x) => stage.classList.toggle("wx-" + x, x === m));
    particles = [];
    const n = { sunny: 26, cloudy: 6, rain: 140, storm: 190, night: 70, mist: 5 }[m];
    for (let i = 0; i < n; i++) particles.push(spawn(m, true));
    badge.innerHTML = `<span class="wx-ico">${ICON[m]}</span><span class="wx-txt"><b>${LABEL[m]}</b><span>${temp != null && live ? Math.round(temp) + "° in Bangkok · live" : (live ? "Bangkok · live" : "try-it mode · tap for next")}</span></span>`;
    badge.title = live ? "Live Bangkok weather — tap to play with other moods" : "Tap to cycle · double-tap for live weather";
    if (opts && opts.burst) { badge.classList.remove("is-pop"); void badge.offsetWidth; badge.classList.add("is-pop"); }
  }

  function spawn(m, anywhere) {
    switch (m) {
      case "sunny": return { x: rnd(0, W), y: anywhere ? rnd(0, H) : H + 10, r: rnd(1.2, 3.2), vy: -rnd(6, 16), vx: rnd(-4, 4), a: rnd(0.15, 0.5), ph: rnd(0, 6.28) };
      case "cloudy": case "mist": return { x: anywhere ? rnd(-200, W) : -320, y: rnd(H * 0.05, H * 0.55), w: rnd(220, 420), h: rnd(60, 110), vx: rnd(6, 14), a: m === "mist" ? rnd(0.10, 0.18) : rnd(0.16, 0.3) };
      case "rain": case "storm": return { x: rnd(-40, W + 40), y: anywhere ? rnd(-H, H) : rnd(-60, -10), len: rnd(10, 22), vy: rnd(420, 640) * (m === "storm" ? 1.3 : 1), vx: m === "storm" ? -90 : -30, a: rnd(0.12, 0.28) };
      case "night": return { x: rnd(0, W), y: rnd(0, H * 0.7), r: rnd(0.6, 1.8), ph: rnd(0, 6.28), sp: rnd(0.6, 1.6) };
    }
  }

  function draw(now) {
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
    ctx.clearRect(0, 0, W, H);
    if (mode === "sunny") {
      // warm glow top-right that breathes
      const p = 0.5 + 0.5 * Math.sin(now / 2600);
      const g = ctx.createRadialGradient(W * 0.86, H * 0.08, 10, W * 0.86, H * 0.08, W * (0.42 + 0.04 * p));
      g.addColorStop(0, "rgba(255, 206, 120, 0.55)"); g.addColorStop(0.35, "rgba(255, 220, 150, 0.22)"); g.addColorStop(1, "rgba(255, 230, 170, 0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // slow light rays
      ctx.save(); ctx.translate(W * 0.86, H * 0.08); ctx.rotate(now / 90000);
      for (let i = 0; i < 7; i++) { ctx.rotate(Math.PI * 2 / 7); ctx.fillStyle = "rgba(255, 225, 160, 0.06)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, -40); ctx.lineTo(W, 40); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      // floating warm sparkles
      particles.forEach((s, i) => {
        s.y += s.vy * dt; s.x += (s.vx + Math.sin(now / 900 + s.ph) * 6) * dt;
        if (s.y < -10) particles[i] = spawn("sunny", false);
        ctx.fillStyle = `rgba(255, 190, 90, ${s.a * (0.6 + 0.4 * Math.sin(now / 500 + s.ph))})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
      });
    } else if (mode === "cloudy" || mode === "mist") {
      particles.forEach((c, i) => {
        c.x += c.vx * dt; if (c.x - c.w > W) particles[i] = spawn(mode, false);
        const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.w * 0.6);
        g.addColorStop(0, `rgba(255,255,255,${c.a})`); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.save(); ctx.scale(1, c.h / c.w); ctx.beginPath(); ctx.arc(c.x, c.y * (c.w / c.h), c.w * 0.6, 0, 6.28); ctx.fill(); ctx.restore();
      });
      if (mode === "mist") { ctx.fillStyle = "rgba(235, 228, 214, 0.12)"; ctx.fillRect(0, 0, W, H); }
    } else if (mode === "rain" || mode === "storm") {
      ctx.lineWidth = 1; ctx.lineCap = "round";
      particles.forEach((d, i) => {
        d.y += d.vy * dt; d.x += d.vx * dt;
        if (d.y > H + 20) particles[i] = spawn(mode, false);
        ctx.strokeStyle = `rgba(96, 63, 91, ${d.a})`;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.vx * 0.03, d.y - d.len); ctx.stroke();
      });
      if (mode === "storm") {
        if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); flash -= dt * 3; }
        else if (Math.random() < dt * 0.12) flash = 1;
      }
    } else if (mode === "night") {
      particles.forEach((s) => {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(now / 1000 * s.sp + s.ph));
        ctx.fillStyle = `rgba(255, 245, 220, ${0.7 * tw})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * tw, 0, 6.28); ctx.fill();
      });
      const g = ctx.createRadialGradient(W * 0.84, H * 0.12, 6, W * 0.84, H * 0.12, 120);
      g.addColorStop(0, "rgba(255, 246, 220, 0.5)"); g.addColorStop(1, "rgba(255, 246, 220, 0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (!document.hidden && !reduce) requestAnimationFrame(draw); else if (!reduce) setTimeout(() => requestAnimationFrame(draw), 800);
  }

  // ---- live weather (Open-Meteo, WMO codes) ----
  function codeToMode(code, isDay) {
    if (!isDay && code <= 2) return "night";
    if (code <= 1) return "sunny";
    if (code <= 3) return "cloudy";
    if (code <= 48) return "mist";
    if (code >= 95) return "storm";
    if (code >= 51) return "rain";
    return "cloudy";
  }
  async function fetchLive() {
    try {
      const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=13.7367&longitude=100.5834&current=temperature_2m,weather_code,is_day&timezone=Asia%2FBangkok", { cache: "no-store" });
      const j = await r.json();
      temp = j.current.temperature_2m;
      return codeToMode(j.current.weather_code, j.current.is_day === 1);
    } catch (e) {
      const h = new Date().getHours();               // offline fallback: guess by time of day
      return h >= 19 || h < 6 ? "night" : "sunny";
    }
  }

  // ---- game-like badge: tap to cycle moods, double-tap back to live ----
  let tapTimer = null;
  badge.addEventListener("click", () => {
    if (tapTimer) { clearTimeout(tapTimer); tapTimer = null; live = true; fetchLive().then((m) => setMode(m, { burst: true })); return; }
    tapTimer = setTimeout(() => { tapTimer = null; live = false; setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length], { burst: true }); }, 260);
  });

  const forced = new URLSearchParams(location.search).get("weather");
  if (forced && MODES.includes(forced)) { live = false; setMode(forced); }
  else { setMode("sunny"); fetchLive().then((m) => setMode(m, { burst: true })); setInterval(() => { if (live) fetchLive().then((m) => { if (m !== mode) setMode(m, { burst: true }); else setMode(m); }); }, 15 * 60 * 1000); }
  requestAnimationFrame(draw);
})();
