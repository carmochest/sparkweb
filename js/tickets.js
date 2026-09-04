/* Spark Play Museum — Tickets: Day Pass builder, Visit Packs, Membership, one cart.
   Prices follow the official price sheet (THB, incl. VAT). Edit PRICES to change. */
(function () {
  const root = document.querySelector("[data-tickets]");
  if (!root) return;
  const PRICES = {
    day: { baby: [0, 0], toddler: [350, 450], explorer: [450, 550], adult: 200, adultExtra: 300 },   // [weekday, weekend]
    packs: [
      { id: "tod5", name: "Toddler · 5-Visit", who: "under 3", price: 2700, per: 540, save: "up to 17%", valid: "3 months" },
      { id: "tod10", name: "Toddler · 10-Visit", who: "under 3", price: 4800, per: 480, save: "up to 26%", valid: "6 months" },
      { id: "exp5", name: "Explorer · 5-Visit", who: "3 yrs +", price: 3100, per: 620, save: "up to 17%", valid: "3 months" },
      { id: "exp10", name: "Explorer · 10-Visit", who: "3 yrs +", price: 5600, per: 560, save: "up to 25%", valid: "6 months" },
    ],
    member: { toddler: 2200, explorer: 2900 },
  };
  const HOLIDAYS = ["2026-10-13", "2026-10-23", "2026-12-05", "2026-12-10", "2026-12-31", "2027-01-01", "2027-04-06", "2027-04-13", "2027-04-14", "2027-04-15", "2027-05-01", "2027-05-04"];
  const LABEL = { baby: "Baby", toddler: "Toddler", explorer: "Explorer", adult: "Adult" };
  const fmt = (n) => n.toLocaleString("en-US");
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6 || HOLIDAYS.includes(key(d));
  const dateStr = (d) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const $ = (s) => root.querySelector(s);

  /* ---------- Day Pass builder ---------- */
  const dateInput = $("#tk-date"), rateEl = $("[data-tk-rate]"), subEl = $("[data-tk-subtotal]"), addBtn = $("[data-tk-add-daypass]");
  const qty = { baby: 0, toddler: 0, explorer: 1, adult: 1 };
  let date = null, addons = {};
  const addonList = typeof BYV !== "undefined" && BYV.addons ? BYV.addons : [];

  const adultCost = (n) => (Math.min(n, 2) * PRICES.day.adult) + (Math.max(0, n - 2) * PRICES.day.adultExtra);
  const dayLines = () => {
    const w = date && isWeekend(date) ? 1 : 0, lines = [];
    ["baby", "toddler", "explorer"].forEach((t) => { if (qty[t]) lines.push({ label: `${LABEL[t]} × ${qty[t]}`, amount: PRICES.day[t][w] * qty[t] }); });
    if (qty.adult) lines.push({ label: `Adult × ${qty.adult}`, amount: adultCost(qty.adult) });
    Object.keys(addons).forEach((id) => { const a = addonList.find((x) => x.id === id); if (a) lines.push({ label: a.title, amount: a.price || 0 }); });
    return lines;
  };
  const daySubtotal = () => dayLines().reduce((s, l) => s + l.amount, 0);
  const kids = () => qty.baby + qty.toddler + qty.explorer;

  function renderBuilder() {
    const w = date && isWeekend(date) ? 1 : 0;
    root.querySelectorAll(".tk-step").forEach((st) => {
      const t = st.dataset.type; st.querySelector("output").textContent = qty[t];
      const p = st.querySelector("[data-price]"); if (p) p.textContent = PRICES.day[t][w];
      st.querySelector("[data-dec]").disabled = qty[t] === 0;
    });
    if (date) { rateEl.hidden = false; rateEl.innerHTML = `<b>${dateStr(date)}</b> · ${w ? "weekend / holiday rate" : "weekday rate"}`; }
    else rateEl.hidden = true;
    subEl.textContent = date ? fmt(daySubtotal()) + " THB" : "pick a date";
    addBtn.disabled = !date || kids() === 0;
    addBtn.textContent = kids() === 0 ? "Add at least one child" : "Add to cart";
    renderAddons();
  }
  function renderAddons() {
    const box = $("[data-tk-addons]"), list = $("[data-tk-addon-list]"), hint = $("[data-tk-addon-hint]");
    if (!date) { box.hidden = true; return; }
    const avail = addonList.filter((a) => a.days.includes(date.getDay()));
    box.hidden = false;
    hint.textContent = avail.length ? "Happening on your visit date — add any to your ticket:" : "No add-on events on this date — your Day Pass covers every zone.";
    list.innerHTML = avail.map((a) => `
      <div class="tk-addon ${addons[a.id] ? "is-on" : ""}">
        <div><span class="tag">${a.cat}</span><strong>${a.title}</strong><span class="small muted">Ages ${a.ages} · ${a.dur} · ${a.time}</span></div>
        <div><b>${a.price ? fmt(a.price) + " THB" : "Free with pass"}</b><button type="button" class="btn btn--small ${addons[a.id] ? "" : "btn--coral"}" data-addon="${a.id}">${addons[a.id] ? "Remove" : "Add"}</button></div>
      </div>`).join("");
    list.querySelectorAll("[data-addon]").forEach((b) => b.addEventListener("click", () => { const id = b.dataset.addon; if (addons[id]) delete addons[id]; else addons[id] = true; renderBuilder(); }));
  }
  dateInput.addEventListener("change", () => { date = dateInput.value ? new Date(dateInput.value + "T00:00:00") : null; addons = {}; renderBuilder(); });
  root.querySelectorAll(".tk-step").forEach((st) => {
    const t = st.dataset.type;
    st.querySelector("[data-inc]").addEventListener("click", () => { qty[t] = Math.min(20, qty[t] + 1); renderBuilder(); });
    st.querySelector("[data-dec]").addEventListener("click", () => { qty[t] = Math.max(0, qty[t] - 1); renderBuilder(); });
  });

  /* ---------- Cart ---------- */
  const cart = [];   // { id, title, meta, amount, recurring? }
  const linesEl = $("[data-tk-lines]"), totalEl = $("[data-tk-total]"), checkoutBtn = $("[data-tk-checkout]"), panel = $("[data-tk-checkout-panel]");
  const total = () => cart.reduce((s, l) => s + l.amount, 0);
  const mini = $("[data-tk-minicart]");
  function renderMini() { if (!mini) return; mini.classList.toggle("is-on", cart.length > 0); $("[data-tk-mini-total]").textContent = fmt(total()) + " THB"; $("[data-tk-mini-count]").textContent = cart.length + (cart.length === 1 ? " item" : " items"); }
  function renderCart() {
    renderMini();
    if (!cart.length) { linesEl.innerHTML = '<p class="muted small">Nothing yet — build a Day Pass, pick a pack, or start a membership.</p>'; totalEl.hidden = true; checkoutBtn.disabled = true; panel.hidden = true; return; }
    linesEl.innerHTML = cart.map((l, i) => `
      <div class="tk-line">
        <div><strong>${l.title}</strong><span class="small muted">${l.meta}</span>${l.sub ? `<span class="small muted">${l.sub}</span>` : ""}</div>
        <div><b>${fmt(l.amount)}</b><button type="button" class="tk-remove" data-remove="${i}" aria-label="Remove ${l.title}">×</button></div>
      </div>`).join("");
    linesEl.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => { cart.splice(Number(b.dataset.remove), 1); renderCart(); }));
    totalEl.hidden = false; totalEl.querySelector("strong").textContent = fmt(total()) + " THB";
    checkoutBtn.disabled = false;
    $("[data-tk-pay-total]").textContent = fmt(total()) + " THB";
    checkoutBtn.classList.remove("is-pop"); void checkoutBtn.offsetWidth; checkoutBtn.classList.add("is-pop");
  }
  const goToCart = () => { const sh = root.closest(".sheet"); const c = $("[data-tk-cart]"); if (sh && window.SparkScroll) window.SparkScroll(sh, c); else if (window.innerWidth < 900) c.scrollIntoView({ behavior: "smooth", block: "start" }); };
  if (mini) $("[data-tk-mini-go]").addEventListener("click", () => goToCart());

  addBtn.addEventListener("click", () => {
    const w = isWeekend(date), parts = [];
    ["baby", "toddler", "explorer"].forEach((t) => { if (qty[t]) parts.push(`${qty[t]} ${LABEL[t].toLowerCase()}`); });
    if (qty.adult) parts.push(`${qty.adult} adult${qty.adult > 1 ? "s" : ""}`);
    const extras = Object.keys(addons).map((id) => (addonList.find((x) => x.id === id) || {}).title).filter(Boolean);
    cart.push({ title: "Day Pass · " + dateStr(date), meta: parts.join(" · ") + (w ? " · weekend rate" : " · weekday rate"), sub: extras.length ? "+ " + extras.join(", ") : "", amount: daySubtotal() });
    addons = {}; renderBuilder(); renderCart(); goToCart();
  });

  /* ---------- Packs ---------- */
  $("[data-tk-packs]").innerHTML = PRICES.packs.map((p) => `
    <div class="tk-pack">
      <div class="tk-pack-top"><strong>${p.name}</strong><span class="tag">${p.who}</span></div>
      <b class="tk-pack-price">${fmt(p.price)}<small> THB</small></b>
      <span class="tk-pack-meta">${p.per} per visit · save ${p.save}</span>
      <span class="tk-pack-meta">Valid ${p.valid} · 1 child + 1 adult per visit</span>
      <button type="button" class="btn btn--small" data-pack="${p.id}">Add pack</button>
    </div>`).join("");
  root.querySelectorAll("[data-pack]").forEach((b) => b.addEventListener("click", () => {
    const p = PRICES.packs.find((x) => x.id === b.dataset.pack);
    cart.push({ title: p.name + " Pack", meta: `${p.per} / visit · valid ${p.valid} · registered to 1 child + 1 adult`, amount: p.price });
    renderCart(); goToCart();
  }));

  /* ---------- Membership ---------- */
  const plan = () => root.querySelector('input[name="tk-plan"]:checked').value;
  const renderMember = () => { $("[data-tk-member-price]").textContent = fmt(PRICES.member[plan()]) + " THB"; };
  root.querySelectorAll('input[name="tk-plan"]').forEach((r) => r.addEventListener("change", renderMember));
  $("[data-tk-add-member]").addEventListener("click", () => {
    const p = plan();
    const i = cart.findIndex((l) => l.member);
    const line = { member: true, title: `${p === "toddler" ? "Toddler" : "Explorer"} Membership`, meta: `${fmt(PRICES.member[p])} / month · 3-month minimum · billed monthly`, sub: "Charged today: first month", amount: PRICES.member[p] };
    if (i >= 0) cart[i] = line; else cart.push(line);
    renderCart(); goToCart();
  });

  /* ---------- Checkout (front-end only; payment goes live with the booking system) ---------- */
  checkoutBtn.addEventListener("click", () => { panel.hidden = false; const sh = root.closest(".sheet"); if (sh && window.SparkScroll) window.SparkScroll(sh, panel); setTimeout(() => $("#tk-name").focus({ preventScroll: true }), 300); });
  $("[data-tk-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, msg = $("[data-tk-form-msg]");
    if (!f.checkValidity()) { msg.textContent = "Please fill in your name, email, mobile and accept the terms."; f.reportValidity(); return; }
    const pay = f.querySelector('input[name="tk-pay"]:checked').value;
    msg.innerHTML = `<b>Order ready — ${fmt(total())} THB by ${pay === "card" ? "card" : "PromptPay"}.</b> Online payment switches on with our booking system; for now we'll confirm by email at <b>${$("#tk-email").value}</b>.`;
    f.querySelector("[data-tk-pay]").disabled = true;
  });

  renderBuilder(); renderMember(); renderCart();
})();
