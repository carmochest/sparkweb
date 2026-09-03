/* Spark Play Museum — Programs: four program groups (expandable cards) and a
   consolidated MONTHLY calendar. Edit PROGRAMS / HOLIDAYS to change what's on. */
(function () {
  const PROGRAMS = [
    {
      id: "playgroups", name: "Playgroups", short: "Playgroups", ages: "1–3 · with caregiver", length: "90 min",
      blurb: "Sensory exploration, music, storytelling and toddler-friendly provocations. Every session ends with museum-zone play.",
      details: ["Small groups — max 10 children", "Led by a Play Facilitator", "Snack break included", "Museum entry for the day included"],
      photo: "assets/photos/water-play.jpg",
      sessions: [{ days: [2, 3, 4, 5], time: "10:00–11:30" }, { days: [6, 0], time: "10:30–12:00" }],
      cta: { label: "Book a playgroup", href: "tickets.html" },
    },
    {
      id: "workshops", name: "Weekend Workshops", short: "Workshops", ages: "3+ · parent optional", length: "45–60 min",
      blurb: "Rotating making sessions that follow the current installation — printing, clay, light, sound.",
      details: ["New theme every week", "Materials and aprons provided", "Take your creation home", "Drop-off from age 5"],
      photo: "assets/photos/painted-hand.jpg",
      sessions: [{ days: [6, 0], time: "13:30–14:30" }, { days: [6, 0], time: "15:00–16:00" }],
      cta: { label: "Book a workshop", href: "tickets.html" },
    },
    {
      id: "afterschool", name: "Afterschool Club", short: "Afterschool", ages: "4–8", length: "60–75 min",
      blurb: "Structured creative sessions with rotating themes across the term — build, make, perform.",
      details: ["Weekly during term time", "8-week blocks, join any time", "Pick-up from BTS Thonglor available", "Members save 10%"],
      photo: "assets/photos/blocks.jpg",
      sessions: [{ days: [1, 2, 3, 4, 5], time: "15:30–16:45", term: true }],
      cta: { label: "Enrol for the term", href: "tickets.html" },
    },
    {
      id: "camps", name: "Holiday Camps", short: "Camp", ages: "4–8", length: "Full day · 9:30–15:00",
      blurb: "A themed week of building, art and group projects during school holidays. Dates announced each season.",
      details: ["Monday–Friday during school holidays", "Lunch and snacks included", "Small groups, two facilitators", "Friday showcase for families"],
      photo: "assets/photos/dino.jpg",
      sessions: [{ days: [1, 2, 3, 4, 5], time: "9:30–15:00", holiday: true }],
      cta: { label: "See upcoming camps", href: "events.html" },
    },
  ];

  // School-holiday weeks (inclusive, YYYY-MM-DD). Camps run on weekdays inside
  // these ranges; Afterschool Club pauses for them.
  const HOLIDAYS = [
    { from: "2026-10-12", to: "2026-10-23", label: "October break" },
    { from: "2026-12-21", to: "2027-01-01", label: "Winter break" },
    { from: "2027-04-05", to: "2027-04-16", label: "Songkran break" },
    { from: "2027-06-28", to: "2027-08-13", label: "Summer camps" },
  ];
  const CLOSED = ["2026-12-25", "2027-01-01"]; // museum closed

  const DAYS_LONG = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayIndex = (d) => (d + 6) % 7; // JS Sunday=0 -> Mon-first grid
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const holidayFor = (d) => { const k = key(d); return HOLIDAYS.find((h) => k >= h.from && k <= h.to) || null; };
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // Everything running on a given date -> [{ prog, session }]
  const sessionsOn = (d) => {
    if (CLOSED.includes(key(d))) return [];
    const hol = holidayFor(d), wd = d.getDay();
    const out = [];
    PROGRAMS.forEach((p) => p.sessions.forEach((s) => {
      if (!s.days.includes(wd)) return;
      if (s.holiday && !hol) return;
      if (s.term && hol) return;
      out.push({ prog: p, session: s });
    }));
    return out;
  };

  document.querySelectorAll("[data-programs]").forEach((root) => {
    const cards = PROGRAMS.map((p) => `
      <article class="prog" id="prog-${p.id}">
        <button type="button" class="prog-head" aria-expanded="false" aria-controls="prog-${p.id}-body">
          <img src="${p.photo}" alt="">
          <span class="prog-title"><strong>${p.name}</strong><span>Ages ${p.ages} · ${p.length}</span></span>
          <span class="prog-toggle" aria-hidden="true">+</span>
        </button>
        <div class="prog-body" id="prog-${p.id}-body" hidden>
          <p>${p.blurb}</p>
          <ul class="prog-list">${p.details.map((d) => `<li>${d}</li>`).join("")}</ul>
          <p class="prog-when"><strong>When:</strong> ${p.sessions.map((s) => (s.holiday ? "School holidays, Mon–Fri · " + s.time : s.days.map((d) => DAYS_LONG[dayIndex(d)]).join(", ") + " · " + s.time)).join(" / ")}</p>
          <p><a class="btn btn--small btn--coral" href="${p.cta.href}">${p.cta.label}</a></p>
        </div>
      </article>`).join("");

    root.innerHTML = `
      <div class="prog-grid">${cards}</div>
      <section class="cal" aria-label="Monthly calendar">
        <div class="cal-head">
          <div class="cal-nav">
            <button type="button" class="cal-btn" data-cal-prev aria-label="Previous month">‹</button>
            <h2 class="cal-month" data-cal-month aria-live="polite"></h2>
            <button type="button" class="cal-btn" data-cal-next aria-label="Next month">›</button>
          </div>
          <button type="button" class="cal-today" data-cal-today>Today</button>
        </div>
        <div class="cal-dow">${DAYS_LONG.map((d) => `<span>${d}</span>`).join("")}</div>
        <div class="cal-grid" data-cal-grid role="grid"></div>
        <div class="cal-key">${PROGRAMS.map((p) => `<span class="cal-key-item"><i class="cal-dot cal-${p.id}"></i>${p.name}</span>`).join("")}</div>
        <div class="cal-day-detail" data-cal-detail></div>
      </section>`;

    const grid = root.querySelector("[data-cal-grid]");
    const monthEl = root.querySelector("[data-cal-month]");
    const detail = root.querySelector("[data-cal-detail]");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let view = new Date(today.getFullYear(), today.getMonth(), 1);
    let selected = new Date(today);

    const toggle = (art, open) => {
      const btn = art.querySelector(".prog-head"), body = art.querySelector(".prog-body");
      const isOpen = open ?? body.hidden;
      body.hidden = !isOpen; btn.setAttribute("aria-expanded", String(isOpen)); art.classList.toggle("is-open", isOpen);
    };
    const jumpTo = (id) => {
      const art = root.querySelector("#prog-" + id);
      toggle(art, true);
      art.scrollIntoView({ block: "start", behavior: "smooth" });
      art.classList.add("is-flash"); setTimeout(() => art.classList.remove("is-flash"), 900);
    };

    const renderDetail = () => {
      const list = sessionsOn(selected), hol = holidayFor(selected);
      const title = `${DAYS_LONG[dayIndex(selected.getDay())]} ${selected.getDate()} ${MONTHS[selected.getMonth()].slice(0, 3)}`;
      const tag = CLOSED.includes(key(selected)) ? "Museum closed" : hol ? hol.label : "";
      detail.innerHTML = `
        <div class="cal-detail-head"><strong>${title}</strong>${tag ? `<span class="cal-tag">${tag}</span>` : ""}</div>
        ${list.length ? `<div class="cal-detail-list">${list.map(({ prog, session }) => `
          <button type="button" class="cal-item" data-prog="${prog.id}">
            <i class="cal-dot cal-${prog.id}"></i><span class="cal-item-name">${prog.name}</span><span class="cal-item-time">${session.time}</span>
          </button>`).join("")}</div>` : `<p class="cal-none">No programs this day — museum play is open 10–7.</p>`}`;
      detail.querySelectorAll(".cal-item").forEach((b) => b.addEventListener("click", () => jumpTo(b.dataset.prog)));
    };

    const render = () => {
      const y = view.getFullYear(), m = view.getMonth();
      monthEl.textContent = `${MONTHS[m]} ${y}`;
      const first = new Date(y, m, 1), lead = dayIndex(first.getDay());
      const daysIn = new Date(y, m + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < lead; i++) cells.push(`<span class="cal-cell cal-cell--pad" aria-hidden="true"></span>`);
      for (let d = 1; d <= daysIn; d++) {
        const date = new Date(y, m, d);
        const list = sessionsOn(date), hol = holidayFor(date), closed = CLOSED.includes(key(date));
        const ids = [...new Set(list.map((x) => x.prog.id))];
        const cls = ["cal-cell"];
        if (sameDay(date, today)) cls.push("is-today");
        if (sameDay(date, selected)) cls.push("is-selected");
        if (hol) cls.push("is-holiday");
        if (closed) cls.push("is-closed");
        if (date.getDay() === 0 || date.getDay() === 6) cls.push("is-weekend");
        if (date < today) cls.push("is-past");
        cells.push(`<button type="button" class="${cls.join(" ")}" data-day="${d}" aria-label="${DAYS_LONG[dayIndex(date.getDay())]} ${d} ${MONTHS[m]}${ids.length ? ", " + ids.length + " program" + (ids.length > 1 ? "s" : "") : ""}">
          <span class="cal-num">${d}</span>
          <span class="cal-dots">${ids.map((id) => `<i class="cal-dot cal-${id}"></i>`).join("")}</span>
        </button>`);
      }
      grid.innerHTML = cells.join("");
      grid.querySelectorAll(".cal-cell[data-day]").forEach((c) => c.addEventListener("click", () => {
        selected = new Date(y, m, Number(c.dataset.day));
        grid.querySelectorAll(".is-selected").forEach((s) => s.classList.remove("is-selected"));
        c.classList.add("is-selected");
        renderDetail();
      }));
      renderDetail();
    };

    root.querySelector("[data-cal-prev]").addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); selected = new Date(view); render(); });
    root.querySelector("[data-cal-next]").addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); selected = new Date(view); render(); });
    root.querySelector("[data-cal-today]").addEventListener("click", () => { view = new Date(today.getFullYear(), today.getMonth(), 1); selected = new Date(today); render(); });
    root.querySelectorAll(".prog-head").forEach((b) => b.addEventListener("click", () => toggle(b.closest(".prog"))));
    render();
  });
})();
