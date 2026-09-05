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
  let renderCart = function () {
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
  };
  const goToCart = () => { const sh = root.closest(".sheet"); const c = $("[data-tk-cart]"); if (sh && window.SparkScroll) window.SparkScroll(sh, c); else if (window.innerWidth < 900) c.scrollIntoView({ behavior: "smooth", block: "start" }); };
  if (mini) $("[data-tk-mini-go]").addEventListener("click", () => goToCart());
  const toastEl = $("[data-tk-toast]"); let toastT = null;
  if (toastEl) document.body.appendChild(toastEl);   // fixed positioning must escape the (transformed, scrolling) sheet
  const toast = (html) => { if (!toastEl) return; const sh = root.closest(".sheet"); if (sh) { const r = sh.getBoundingClientRect(); toastEl.style.left = (r.left + r.width / 2) + "px"; toastEl.style.bottom = (window.innerHeight - r.bottom + 78) + "px"; toastEl.style.maxWidth = (r.width - 32) + "px"; } toastEl.innerHTML = html; toastEl.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("is-on"), 4500); toastEl.querySelectorAll("[data-tk-toast-go]").forEach((b) => b.addEventListener("click", () => { toastEl.classList.remove("is-on"); goToCart(); })); };
  const added = (what) => { toast(`<b>Added to cart</b><span>${what}</span><button type="button" class="tk-link" data-tk-toast-go>Go to cart →</button>`); if (mini) { mini.classList.remove("is-pop"); void mini.offsetWidth; mini.classList.add("is-pop"); } };

  addBtn.addEventListener("click", () => {
    const w = isWeekend(date), parts = [];
    ["baby", "toddler", "explorer"].forEach((t) => { if (qty[t]) parts.push(`${qty[t]} ${LABEL[t].toLowerCase()}`); });
    if (qty.adult) parts.push(`${qty.adult} adult${qty.adult > 1 ? "s" : ""}`);
    const extras = Object.keys(addons).map((id) => (addonList.find((x) => x.id === id) || {}).title).filter(Boolean);
    cart.push({ title: "Day Pass · " + dateStr(date), meta: parts.join(" · ") + (w ? " · weekend rate" : " · weekday rate"), sub: extras.length ? "+ " + extras.join(", ") : "", amount: daySubtotal() });
    addons = {}; renderBuilder(); renderCart(); added("Day Pass · " + dateStr(date));
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
    renderCart(); added(p.name + " Pack");
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
    renderCart(); added(line.title + (i >= 0 ? " (updated)" : ""));
  });

  /* ---------- Tabs: Day Pass / Packs / Membership ---------- */
  const tabs = [...root.querySelectorAll("[data-tab]")];
  function showTab(id, scroll) {
    tabs.forEach((t) => { const on = t.dataset.tab === id; t.classList.toggle("is-on", on); t.setAttribute("aria-selected", String(on)); });
    root.querySelectorAll(".tk-panel").forEach((p) => { p.hidden = p.id !== id; });
    if (scroll) { const sh = root.closest(".sheet"), p = root.querySelector("#" + id); if (sh && window.SparkScroll) window.SparkScroll(sh, root.querySelector(".tk-choose")); else if (window.innerWidth < 900) p.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  tabs.forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab, true)));
  const openTabFromHash = () => { const h = (location.hash.match(/(?:#|\/)(day-pass|packs|membership)\b/) || [])[1]; if (h) showTab(h); };
  openTabFromHash(); window.addEventListener("hashchange", openTabFromHash);
  document.addEventListener("spark:sheet", (e) => { if (e.detail.name === "tickets" && ["day-pass", "packs", "membership"].includes(e.detail.anchor)) showTab(e.detail.anchor); });

  /* ---------- Checkout (front-end only; the payment partner plugs in here) ---------- */
  const form = $("[data-tk-form]"), memberBox = $("[data-tk-memberdetails]");
  const hasMember = () => cart.some((l) => l.member);
  function renderCheckoutShape() {
    memberBox.hidden = !hasMember();
    memberBox.querySelectorAll("[data-member-req]").forEach((i) => { i.required = hasMember(); });
    $("[data-tk-paystep]").textContent = hasMember() ? "3" : "2";
    $("[data-tk-sumstep]").textContent = hasMember() ? "4" : "3";
    $("[data-tk-qr-amount]").textContent = fmt(total()) + " THB";
    $("[data-tk-summary]").innerHTML = cart.map((l) => `<div class="tk-sum-line"><span>${l.title}<small>${l.meta}</small></span><b>${fmt(l.amount)}</b></div>`).join("") + `<div class="tk-sum-total"><span>Total today <small>incl. 7% VAT</small></span><b>${fmt(total())} THB</b></div>`;
  }
  $("[data-tk-back]").addEventListener("click", () => { const sh = root.closest(".sheet"), t = root.querySelector(".tk-choose-wrap"); if (sh && window.SparkScroll) window.SparkScroll(sh, t); else t.scrollIntoView({ behavior: "smooth", block: "start" }); });
  checkoutBtn.addEventListener("click", () => { renderCheckoutShape(); panel.hidden = false; const sh = root.closest(".sheet"); if (sh && window.SparkScroll) window.SparkScroll(sh, panel); else if (window.innerWidth < 900) panel.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => $("#tk-name").focus({ preventScroll: true }), 300); });

  // payment method → panel
  const payRadios = [...form.querySelectorAll('input[name="tk-pay"]')];
  const payMethod = () => (payRadios.find((r) => r.checked) || {}).value || "card";
  function renderPay() {
    const m = payMethod();
    form.querySelectorAll("[data-tk-paypanel]").forEach((p) => { p.hidden = p.dataset.tkPaypanel !== m; });
    form.querySelectorAll(".tk-paymethod").forEach((l) => l.classList.toggle("is-on", l.querySelector("input").checked));
    form.querySelectorAll("[data-pay-req]").forEach((i) => { i.required = m === "card"; });
    $("[data-tk-pay-label]").textContent = m === "card" ? "Pay" : "Show QR for";
  }
  payRadios.forEach((r) => r.addEventListener("change", renderPay)); renderPay();

  // card number formatting + brand detection
  const cardNo = $("#tk-cardno"), brandEl = $("[data-tk-brand]"), exp = $("#tk-exp"), cvc = $("#tk-cvc");
  const brandOf = (n) => (/^4/.test(n) ? "visa" : /^(5[1-5]|2[2-7])/.test(n) ? "mc" : /^35/.test(n) ? "jcb" : /^3[47]/.test(n) ? "amex" : "");
  cardNo.addEventListener("input", () => { const d = cardNo.value.replace(/\D/g, "").slice(0, 19); cardNo.value = d.replace(/(.{4})/g, "$1 ").trim(); const b = brandOf(d); brandEl.className = "tk-brand" + (b ? " is-" + b : ""); brandEl.textContent = b === "visa" ? "VISA" : b === "mc" ? "" : b === "jcb" ? "JCB" : b === "amex" ? "AMEX" : ""; });
  exp.addEventListener("input", () => { const d = exp.value.replace(/\D/g, "").slice(0, 4); exp.value = d.length > 2 ? d.slice(0, 2) + " / " + d.slice(2) : d; });
  cvc.addEventListener("input", () => { cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4); });
  const luhn = (n) => { let s2 = 0, alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s2 += d; alt = !alt; } return n.length >= 13 && s2 % 10 === 0; };
  $("#tk-photo").addEventListener("change", (e) => { $("[data-tk-file-label]").textContent = e.target.files[0] ? e.target.files[0].name : "Choose a photo…"; });

  // a QR-looking placeholder (deterministic pattern from the amount) until the payment partner supplies the real EMV QR
  function drawQR(seed) {
    const N = 25, cells = []; let x = seed * 2654435761 % 4294967296;
    const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
    const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      let on;
      if (finder(r, c)) { const rr = r < 7 ? r : r - (N - 7), cc = c < 7 ? c : c - (N - 7); on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4); }
      else on = rnd() < 0.45;
      if (on) cells.push(`<rect x="${c}" y="${r}" width="1" height="1"/>`);
    }
    return `<svg viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges">${cells.join("")}</svg>`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = $("[data-tk-form-msg]"); msg.textContent = "";
    if (!form.checkValidity()) { msg.textContent = "Please complete the highlighted fields and accept the terms."; form.reportValidity(); return; }
    const m = payMethod();
    if (m === "card") {
      const digits = cardNo.value.replace(/\D/g, "");
      if (!luhn(digits)) { msg.textContent = "That card number doesn't look right — please check it."; cardNo.focus(); return; }
      const [mm, yy] = exp.value.split("/").map((v) => parseInt(v, 10)); const now = new Date();
      if (!(mm >= 1 && mm <= 12) || isNaN(yy) || (2000 + yy) * 12 + mm < now.getFullYear() * 12 + now.getMonth() + 1) { msg.textContent = "Please check the card expiry date."; exp.focus(); return; }
      if (cvc.value.length < 3) { msg.textContent = "Please enter the 3- or 4-digit security code."; cvc.focus(); return; }
      success(`Paid ${fmt(total())} THB · card ending ${digits.slice(-4)}`, "card");
    } else {
      $("[data-tk-qr]").innerHTML = drawQR(total() + cart.length * 7); $("[data-tk-qr]").classList.add("is-live"); $("[data-tk-qr-amount]").textContent = fmt(total()) + " THB";
      msg.innerHTML = `<b>Scan to pay ${fmt(total())} THB.</b> This QR is a preview until PromptPay is connected — tickets will be emailed to <b>${$("#tk-email").value}</b> once paid.`;
      $("[data-tk-pay-label]").textContent = "Waiting for payment…"; form.querySelector("[data-tk-pay]").disabled = true;
      const sh = root.closest(".sheet"), q = $("[data-tk-qr]"); if (sh && window.SparkScroll) window.SparkScroll(sh, q.closest(".tk-block")); else q.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
  function success(headline, how) {
    const box = $("[data-tk-success]");
    box.innerHTML = `<div class="tk-success-ico">✓</div><h3>Order received</h3><p class="tk-success-head">${headline}</p>
      <div class="tk-summary">${cart.map((l) => `<div class="tk-sum-line"><span>${l.title}<small>${l.meta}</small></span><b>${fmt(l.amount)}</b></div>`).join("")}</div>
      <ul class="tk-next"><li>E-tickets and your tax invoice are on their way to <b>${$("#tk-email").value}</b>.</li>${hasMember() ? "<li>Your membership profile is being set up — bring the child's photo on your first visit if you didn't upload one.</li>" : ""}<li>Show the QR in your email at the front desk. Members and pack holders can also check in with the mobile number <b>${$("#tk-phone").value}</b>.</li></ul>
      <p class="small muted">${how === "card" ? "Live card processing switches on with our payment partner — until then we confirm every order by email." : "PromptPay goes live with our payment partner — until then we confirm every order by email."}</p>
      <button type="button" class="btn btn--coral" data-tk-done>Done</button>`;
    form.hidden = true; box.hidden = false; $(".tk-ck-top").hidden = true;
    const sh = root.closest(".sheet"); if (sh && window.SparkScroll) window.SparkScroll(sh, panel); else panel.scrollIntoView({ behavior: "smooth", block: "start" });
    box.querySelector("[data-tk-done]").addEventListener("click", () => { cart.length = 0; renderCart(); form.reset(); form.hidden = false; $(".tk-ck-top").hidden = false; box.hidden = true; panel.hidden = true; form.querySelector("[data-tk-pay]").disabled = false; renderPay(); const t = root.querySelector(".tk-choose-wrap"); if (sh && window.SparkScroll) window.SparkScroll(sh, t); else t.scrollIntoView({ behavior: "smooth" }); });
  }
  const _renderCart = renderCart;
  renderCart = function () { _renderCart(); if (!panel.hidden) renderCheckoutShape(); };

  renderBuilder(); renderMember(); renderCart();
})();
