/* Spark Play Museum — brand date picker. Progressively enhances every
   <input type="date">: the native input stays in the form (value, name,
   min/max, change events all work), we just draw a nicer way to pick. */
(function () {
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const CLOSED = ["2026-12-25", "2027-01-01"];
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (v) => (v ? new Date(v + "T00:00:00") : null);
  const fmt = (d) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14.5" r="1" fill="currentColor" stroke="none"/></svg>';
  let open = null;

  function enhance(input) {
    if (input.dataset.dp) return; input.dataset.dp = "1";
    const past = !!input.dataset.dpPast;   // e.g. a date of birth: past allowed, future not
    const tNow = new Date();
    if (!past && !input.min) input.min = `${tNow.getFullYear()}-${pad(tNow.getMonth() + 1)}-${pad(tNow.getDate())}`;   // no booking in the past
    if (past && !input.max) input.max = `${tNow.getFullYear()}-${pad(tNow.getMonth() + 1)}-${pad(tNow.getDate())}`;
    const wrap = document.createElement("div"); wrap.className = "dp-wrap";
    input.parentNode.insertBefore(wrap, input); wrap.appendChild(input);
    const field = document.createElement("button"); field.type = "button"; field.className = "dp-field"; field.setAttribute("aria-haspopup", "dialog"); field.setAttribute("aria-expanded", "false");
    const pop = document.createElement("div"); pop.className = "dp-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Choose a date"); pop.hidden = true;
    wrap.appendChild(field); wrap.appendChild(pop);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let view = null;
    const min = () => parse(input.min), max = () => parse(input.max);
    const inRange = (d) => (!min() || d >= min()) && (!max() || d <= max()) && !CLOSED.includes(key(d));

    const renderField = () => { const d = parse(input.value); field.innerHTML = `<span class="${d ? "" : "dp-placeholder"}">${d ? fmt(d) : (input.placeholder || "Pick a date")}</span>${ICON}`; };
    const render = () => {
      const y = view.getFullYear(), m = view.getMonth(), sel = parse(input.value);
      const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
      const mn = min(), mx = max();
      const prevOk = !mn || new Date(y, m, 0) >= new Date(mn.getFullYear(), mn.getMonth(), 1);
      const nextOk = !mx || new Date(y, m + 1, 1) <= mx;
      let cells = "";
      for (let i = 0; i < lead; i++) cells += '<span class="dp-day dp-day--pad" aria-hidden="true"></span>';
      for (let d = 1; d <= days; d++) {
        const date = new Date(y, m, d), ok = inRange(date), wk = date.getDay() === 0 || date.getDay() === 6;
        const cls = ["dp-day", wk ? "is-weekend" : "", key(date) === key(today) ? "is-today" : "", sel && key(date) === key(sel) ? "is-selected" : ""].filter(Boolean).join(" ");
        cells += `<button type="button" class="${cls}" data-d="${d}" ${ok ? "" : "disabled"} aria-label="${fmt(date)}${CLOSED.includes(key(date)) ? ", museum closed" : ""}">${d}</button>`;
      }
      pop.innerHTML = `
        <div class="dp-head"><button type="button" class="dp-btn" data-prev aria-label="Previous month" ${prevOk ? "" : "disabled"}>‹</button>${past
          ? `<span class="dp-selects"><select data-month aria-label="Month">${MONTHS.map((mn, i) => `<option value="${i}" ${i === m ? "selected" : ""}>${mn}</option>`).join("")}</select><select data-year aria-label="Year">${Array.from({ length: 13 }, (_, i) => today.getFullYear() - i).map((yy) => `<option value="${yy}" ${yy === y ? "selected" : ""}>${yy}</option>`).join("")}</select></span>`
          : `<h3>${MONTHS[m]} ${y}</h3>`}<button type="button" class="dp-btn" data-next aria-label="Next month" ${nextOk ? "" : "disabled"}>›</button></div>
        <div class="dp-dow">${DOW.map((x) => `<span>${x}</span>`).join("")}</div>
        <div class="dp-grid">${cells}</div>
        <div class="dp-foot"><span>${past ? "" : `<i></i>${input.dataset.note || "Weekends"}`}</span><span>${past ? "" : '<button type="button" class="dp-link" data-today>Today</button>'}${input.value ? ' · <button type="button" class="dp-link" data-clear>Clear</button>' : ""}</span></div>`;
      pop.querySelector("[data-prev]").addEventListener("click", () => { view = new Date(y, m - 1, 1); render(); });
      const ms = pop.querySelector("[data-month]"), ys = pop.querySelector("[data-year]");
      if (ms) { ms.addEventListener("change", () => { view = new Date(y, Number(ms.value), 1); render(); }); ys.addEventListener("change", () => { view = new Date(Number(ys.value), m, 1); render(); }); }
      pop.querySelector("[data-next]").addEventListener("click", () => { view = new Date(y, m + 1, 1); render(); });
      const td = pop.querySelector("[data-today]"); if (td) td.addEventListener("click", () => { view = new Date(today.getFullYear(), today.getMonth(), 1); if (inRange(today)) pick(today); else render(); });
      const clr = pop.querySelector("[data-clear]"); if (clr) clr.addEventListener("click", () => { set(""); close(); });
      pop.querySelectorAll(".dp-day[data-d]").forEach((b) => b.addEventListener("click", () => pick(new Date(y, m, Number(b.dataset.d)))));
    };
    const set = (v) => { input.value = v; renderField(); input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true })); };
    const pick = (d) => { set(key(d)); close(); field.focus(); };
    const show = () => {
      if (open && open !== close) open();
      const base = parse(input.value) || (past ? new Date(today.getFullYear() - 2, today.getMonth(), 1) : (min() && min() > today ? min() : today));
      view = new Date(base.getFullYear(), base.getMonth(), 1);
      render(); pop.hidden = false; field.setAttribute("aria-expanded", "true"); open = close;
      // keep the popover inside its scroll container
      requestAnimationFrame(() => { const sc = wrap.closest(".sheet") || document.scrollingElement; const r = pop.getBoundingClientRect(), lim = (wrap.closest(".sheet") ? sc.getBoundingClientRect().bottom : window.innerHeight) - 12; if (r.bottom > lim && window.SparkScroll && wrap.closest(".sheet")) window.SparkScroll(wrap.closest(".sheet"), field); });
      const f = pop.querySelector(".dp-day.is-selected") || pop.querySelector(".dp-day.is-today:not(:disabled)") || pop.querySelector(".dp-day:not(:disabled)"); if (f) f.focus({ preventScroll: true });
    };
    function close() { pop.hidden = true; field.setAttribute("aria-expanded", "false"); if (open === close) open = null; }
    field.addEventListener("click", () => (pop.hidden ? show() : close()));
    pop.addEventListener("keydown", (e) => { if (e.key === "Escape") { close(); field.focus(); } });
    document.addEventListener("click", (e) => { if (!pop.hidden && !wrap.contains(e.target)) close(); });
    input.addEventListener("change", renderField);
    renderField();
  }
  document.querySelectorAll('input[type="date"]').forEach(enhance);
  new MutationObserver(() => document.querySelectorAll('input[type="date"]:not([data-dp])').forEach(enhance)).observe(document.body, { childList: true, subtree: true });
})();
