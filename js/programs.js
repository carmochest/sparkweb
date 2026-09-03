/* Spark Play Museum — Programs: four program groups (expandable cards) and a
   consolidated weekly calendar. Edit PROGRAMS to change what's on. */
(function () {
  const PROGRAMS = [
    {
      id: "playgroups", name: "Playgroups", ages: "1–3 · with caregiver", length: "90 min",
      blurb: "Sensory exploration, music, storytelling and toddler-friendly provocations. Every session ends with museum-zone play.",
      details: ["Small groups — max 10 children", "Led by a Play Facilitator", "Snack break included", "Museum entry for the day included"],
      photo: "assets/photos/water-play.jpg",
      sessions: [{ days: [2, 3, 4, 5], time: "10:00–11:30" }, { days: [6, 0], time: "10:30–12:00" }],
      cta: { label: "Book a playgroup", href: "tickets.html" },
    },
    {
      id: "workshops", name: "Weekend Workshops", ages: "3+ · parent optional", length: "45–60 min",
      blurb: "Rotating making sessions that follow the current installation — printing, clay, light, sound.",
      details: ["New theme every week", "Materials and aprons provided", "Take your creation home", "Drop-off from age 5"],
      photo: "assets/photos/painted-hand.jpg",
      sessions: [{ days: [6, 0], time: "13:30–14:30" }, { days: [6, 0], time: "15:00–16:00" }],
      cta: { label: "Book a workshop", href: "tickets.html" },
    },
    {
      id: "afterschool", name: "Afterschool Club", ages: "4–8", length: "60–75 min",
      blurb: "Structured creative sessions with rotating themes across the term — build, make, perform.",
      details: ["Weekly during term time", "8-week blocks, join any time", "Pick-up from BTS Thonglor available", "Members save 10%"],
      photo: "assets/photos/blocks.jpg",
      sessions: [{ days: [1, 2, 3, 4, 5], time: "15:30–16:45" }],
      cta: { label: "Enrol for the term", href: "tickets.html" },
    },
    {
      id: "camps", name: "Holiday Camps", ages: "4–8", length: "Full day · 9:30–15:00",
      blurb: "A themed week of building, art and group projects during school holidays. Dates announced each season.",
      details: ["Monday–Friday during school holidays", "Lunch and snacks included", "Small groups, two facilitators", "Friday showcase for families"],
      photo: "assets/photos/dino.jpg",
      sessions: [{ days: [1, 2, 3, 4, 5], time: "School holidays · 9:30–15:00", holiday: true }],
      cta: { label: "See upcoming camps", href: "events.html" },
    },
  ];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayIndex = (d) => (d + 6) % 7; // JS Sunday=0 -> Mon-first grid

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
          <p class="prog-when"><strong>When:</strong> ${p.sessions.map((s) => (s.holiday ? s.time : s.days.map((d) => DAYS[dayIndex(d)]).join(", ") + " · " + s.time)).join(" / ")}</p>
          <p><a class="btn btn--small btn--coral" href="${p.cta.href}">${p.cta.label}</a></p>
        </div>
      </article>`).join("");

    // weekly calendar: one column per day, chips for each program running that day
    const cols = DAYS.map((label, i) => {
      const jsDay = (i + 1) % 7;
      const chips = PROGRAMS.flatMap((p) => p.sessions.filter((s) => s.days.includes(jsDay)).map((s) => `
        <button type="button" class="cal-chip cal-${p.id}${s.holiday ? " cal-chip--holiday" : ""}" data-prog="${p.id}" title="${p.name}">
          <b>${p.name}</b><span>${s.holiday ? "holidays only" : s.time}</span>
        </button>`)).join("");
      return `<div class="cal-col${i >= 5 ? " cal-col--weekend" : ""}"><div class="cal-day">${label}</div>${chips || '<div class="cal-empty">—</div>'}</div>`;
    }).join("");

    root.innerHTML = `
      <div class="prog-grid">${cards}</div>
      <div class="cal">
        <div class="cal-head"><h2>Weekly calendar</h2><p class="muted">Tap a chip to jump to that program. Holiday Camps run only during school holidays.</p></div>
        <div class="cal-grid">${cols}</div>
        <div class="cal-key">${PROGRAMS.map((p) => `<span class="cal-key-item cal-${p.id}">${p.name}</span>`).join("")}</div>
      </div>`;

    const toggle = (art, open) => {
      const btn = art.querySelector(".prog-head"), body = art.querySelector(".prog-body");
      const isOpen = open ?? body.hidden;
      body.hidden = !isOpen; btn.setAttribute("aria-expanded", String(isOpen)); art.classList.toggle("is-open", isOpen);
    };
    root.querySelectorAll(".prog-head").forEach((b) => b.addEventListener("click", () => toggle(b.closest(".prog"))));
    root.querySelectorAll(".cal-chip").forEach((c) => c.addEventListener("click", () => {
      const art = root.querySelector("#prog-" + c.dataset.prog);
      toggle(art, true);
      art.scrollIntoView({ block: "start", behavior: "smooth" });
      art.classList.add("is-flash"); setTimeout(() => art.classList.remove("is-flash"), 900);
    }));
  });
})();
