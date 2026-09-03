/* Spark Play Museum — draw-on spark marks
   Each brand mark is revealed the way it would be drawn by hand:
   starbursts shoot their rays out from the centre, the lightning zig-zags
   from top to bottom, the star outline is traced around from its tip.
   Technique: the filled artwork is masked by a stroked "spine" path whose
   dash offset is animated, so the fill appears only where the pen has been.
   Requires spark-marks.js (window.SPARK_MARKS). */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  let uid = 0;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* Build one mark as an <svg>. Returns { svg, strokes:[{path,len}], g } */
  function create(n) {
    const m = window.SPARK_MARKS[n];
    const id = "spk" + (++uid);
    const svg = el("svg", { viewBox: m.view.join(" "), class: "spark-mark spark-mark--" + n, "aria-hidden": "true" });
    const defs = el("defs", {});
    const mask = el("mask", { id, maskUnits: "userSpaceOnUse", x: m.view[0], y: m.view[1], width: m.view[2], height: m.view[3] });
    const strokes = [];
    const sp = m.spine;
    const common = { fill: "none", stroke: "#fff", "stroke-width": sp.width, "stroke-linecap": "round", "stroke-linejoin": "round" };
    if (sp.type === "rays") {
      // a small disc at the centre so the hub appears first
      mask.appendChild(el("circle", { cx: sp.cx, cy: sp.cy, r: sp.width * 0.45, fill: "#fff" }));
      sp.rays.forEach((r) => {
        const p = el("path", Object.assign({ d: `M${r[0]} ${r[1]} L${r[2]} ${r[3]}` }, common));
        mask.appendChild(p); strokes.push({ path: p });
      });
    } else {
      const d = sp.points.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
      const p = el("path", Object.assign({ d }, common));
      mask.appendChild(p); strokes.push({ path: p });
    }
    defs.appendChild(mask); svg.appendChild(defs);
    const g = el("g", { mask: `url(#${id})` });
    g.appendChild(el("path", { d: m.art, fill: m.color, "fill-rule": "nonzero" }));
    svg.appendChild(g);
    // unmasked copy: fades in over the last stretch of the draw so any bit the
    // spine missed arrives softly instead of popping
    const full = el("path", { d: m.art, fill: m.color, "fill-rule": "nonzero", opacity: "0" });
    svg.appendChild(full);
    return { svg, strokes, g, full, n, mask, sp };
  }

  /* Prime the dashes so nothing is visible yet. Must be in the DOM. */
  function prime(mark) {
    mark.strokes.forEach((s) => {
      s.len = s.path.getTotalLength();
      s.path.setAttribute("stroke-dasharray", s.len);
      s.path.setAttribute("stroke-dashoffset", s.len);
    });
    mark.g.setAttribute("mask", `url(#${mark.mask.id})`);
    mark.g.setAttribute("opacity", "1");
    mark.full.setAttribute("opacity", "0");
    mark.svg.style.opacity = "1";
  }

  function setProgress(mark, t) {
    // t 0..1 over the whole mark; the unmasked copy fades in from 0.78 -> 1
    const f = Math.min(1, Math.max(0, (t - 0.78) / 0.22));
    mark.full.setAttribute("opacity", f.toFixed(3));
    if (mark.sp.type === "rays") {
      const n = mark.strokes.length, stagger = 0.35;
      mark.strokes.forEach((s, i) => {
        const start = (i / n) * stagger, local = Math.min(1, Math.max(0, (t - start) / (1 - stagger)));
        s.path.setAttribute("stroke-dashoffset", s.len * (1 - easeOut(local)));
      });
    } else {
      const s = mark.strokes[0];
      s.path.setAttribute("stroke-dashoffset", s.len * (1 - easeInOut(t)));
    }
  }

  function animate(mark, from, to, ms, done) {
    if (reduce) { setProgress(mark, to); if (done) done(); return; }
    const t0 = performance.now();
    mark.g.setAttribute("mask", `url(#${mark.mask.id})`);
    function frame(now) {
      const k = Math.min(1, (now - t0) / ms);
      setProgress(mark, from + (to - from) * k);
      if (k < 1) requestAnimationFrame(frame);
      else { if (done) done(); }
    }
    requestAnimationFrame(frame);
  }

  const draw = (mark, ms, done) => { prime(mark); animate(mark, 0, 1, ms || (mark.sp.type === "rays" ? 520 : 700), done); };
  const undraw = (mark, ms, done) => animate(mark, 1, 0, ms || 380, () => { mark.svg.style.opacity = "0"; if (done) done(); });

  window.SparkDraw = { create, draw, undraw, prime, count: 4 };
})();
