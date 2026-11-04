/* ============================================================
   JCBC SHOP  —  basket → bank transfer → receipt + spreadsheet
   ------------------------------------------------------------
   HOW IT WORKS
   1. Customers add items to a basket (saved in their browser).
   2. At checkout they enter their details and are shown the
      club's bank-transfer instructions with a unique reference.
   3. On "Place order" the order is sent to ORDER_ENDPOINT
      (a Google Apps Script web app — see orders-backend.gs),
      which (a) appends the order to your Google Sheet and
      (b) emails the customer a receipt.
   4. After CLOSE_DATE the whole shop greys out and locks.

   >>> EDIT THE CONFIG BELOW <<<
   ============================================================ */
const SHOP_CONFIG = {
  // Shop closes at the end of this moment (local time). After it,
  // the shop greys out and no orders can be placed.
  closeDate: "2026-11-06T20:00:00",

  // Paste your deployed Apps Script Web App URL here to enable
  // email receipts + the orders spreadsheet. If left blank, the
  // "Place order" button falls back to opening an email instead.
  orderEndpoint: "https://script.google.com/macros/s/AKfycbwMM7VFwug1mS6cvLLJE2xrV1rIkwwC7NpGB6sBfntExJ9UBwVMGOJZFKW8kjmabwmstg/exec",

  // Where order notifications / fallback emails go.
  treasurerEmail: "jcbc-treasurer@jcsu.jesus.cam.ac.uk",

  // Bank details shown to customers for the transfer.
  bank: {
    name: "Jesus College Boat Club",
    sortCode: "30-91-56",
    accountNumber: "00538948"
  },

  currency: "£"
};

(function () {
  "use strict";
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const LS = "jcbc_basket_v1";
  const money = n => SHOP_CONFIG.currency + n.toFixed(2).replace(/\.00$/, "");
  const closed = () => new Date() > new Date(SHOP_CONFIG.closeDate);
  // Per-range deadlines: a section with data-close="YYYY-MM-DDTHH:MM:SS" closes its own
  // products earlier than the whole shop (e.g. the trackies). Default: SHOP_CONFIG.closeDate.
  const past = d => new Date() > new Date(d);
  const closeOf = el => { const s = el && el.closest("[data-close]"); return s ? s.dataset.close : SHOP_CONFIG.closeDate; };
  const dayFmt = d => new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  // Bank details not filled in yet: take orders, and the treasurer emails payment details.
  const payLater = () => { const b = SHOP_CONFIG.bank || {};
    return !b.sortCode || !b.accountNumber || /^[0-]+$/.test(b.sortCode) || /^0+$/.test(b.accountNumber); };

  let basket = [];
  try { basket = JSON.parse(localStorage.getItem(LS)) || []; } catch (e) { basket = []; }
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(basket)); } catch (e) {} };

  /* ---------- status banner under the hero ---------- */
  function banner() {
    if (window.JCBC_SHOP_LIVE === false) return;   // stash hidden: no open/closed banner
    const hero = $(".page-hero");
    if (!hero) return;
    const b = document.createElement("div");
    b.className = "shop-banner";
    const close = new Date(SHOP_CONFIG.closeDate);
    const fmt = close.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    if (closed()) {
      b.innerHTML = '<span class="dot"></span><span>The shop is now <b>closed</b>. Thank you for your orders; it will reopen for the next stash drop.</span>';
    } else {
      const days = Math.max(0, Math.ceil((close - new Date()) / 86400000));
      if (days <= 14) b.classList.add("urgent");
      b.innerHTML = '<span class="dot"></span><span>' + (days <= 14 ? '<b>Last call</b> · ' : 'Shop is <b>open</b> · ') +
                    'orders close <b>' + fmt + '</b>' +
                    (days <= 60 ? ' · <b>' + (days <= 1 ? 'final day' : days + ' days left') + '</b>' : '') +
                    $$("[data-close][data-close-label]").filter(s => !past(s.dataset.close))
                      .map(s => ' · ' + esc(s.dataset.closeLabel) + ' close <b>' + dayFmt(s.dataset.close) + '</b>').join("") + '</span>';
    }
    hero.insertAdjacentElement("afterend", b);
  }

  /* ---------- live countdown to the order deadline ---------- */
  function countdown() { $$("[data-countdown]").forEach(countdownBox); }
  function countdownBox(box) {
    const endStr = box.dataset.countdown || SHOP_CONFIG.closeDate;
    if (closed() || past(endStr)) { box.remove(); return; }
    const end = new Date(endStr), pad = n => String(n).padStart(2, "0");
    const tick = () => {
      let ms = end - new Date();
      if (ms <= 0) { location.reload(); return; }
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4), s = Math.floor((ms - m * 6e4) / 1e3);
      $("[data-cd=d]", box).textContent = pad(d); $("[data-cd=h]", box).textContent = pad(h);
      $("[data-cd=m]", box).textContent = pad(m); $("[data-cd=s]", box).textContent = pad(s);
      box.classList.toggle("final", d < 3);
    };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- build drawer + modal ---------- */
  function ui() {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="bk-overlay" id="bkOverlay"></div>' +
      '<aside class="drawer" id="drawer" aria-label="Basket">' +
        '<div class="dhead"><h3>Your Basket</h3><button class="dclose" id="drawerClose" aria-label="Close">&times;</button></div>' +
        '<div class="ditems" id="ditems"></div>' +
        '<div class="dfoot" id="dfoot"></div>' +
      '</aside>' +
      '<div class="bk-modal" id="bkModal"><div class="mcard" id="mcard"></div></div>';
    document.body.appendChild(wrap);
    $("#bkOverlay").addEventListener("click", closeAll);
    $("#drawerClose").addEventListener("click", closeAll);
  }

  /* ---------- add-to-basket wiring (reads name/price from card) ---------- */
  function wireProducts() {
    $$(".product .padd").forEach(btn => {
      const original = btn.textContent;
      btn.addEventListener("click", () => {
        if (closed() || past(closeOf(btn))) return;
        const card = btn.closest(".product");
        const name = $("h3", card).textContent.trim();
        const price = parseFloat(($(".pprice", card).textContent || "").replace(/[^0-9.]/g, "")) || 0;
        const sizeSel = card.querySelector("select.size");
        if (sizeSel && !sizeSel.value) { sizeSel.classList.add("needs"); sizeSel.focus(); setTimeout(() => sizeSel.classList.remove("needs"), 1200); return; }
        const colSel = card.querySelector("select.colour");
        if (colSel && !colSel.value) { colSel.classList.add("needs"); colSel.focus(); setTimeout(() => colSel.classList.remove("needs"), 1200); return; }
        const size = sizeSel ? sizeSel.value : "";
        const itemName = colSel ? name + " · " + colSel.value : name;
        const k = keyOf({ name: itemName, size: size });
        if (!canAdd(k)) { closeAll(); notice("Not enough stock", noStockMsg(name, size, k)); return; }
        const members = !!card.closest("[data-members-only]");
        addItem(itemName, price, size, closeOf(card), members);
        if (members && !memberConfirmed) askMember(name, idOf({ name: itemName, size: size }));
        else openDrawer();
        btn.textContent = "Added ✓";
        setTimeout(() => { btn.textContent = original; }, 1100);
      });
    });
  }

  /* optional colour selector: swap photos and badge from the chosen <option data-*> */
  function wireColours() {
    $$(".product select.colour").forEach(sel => {
      sel.addEventListener("change", () => {
        const card = sel.closest(".product"), o = sel.selectedOptions[0];
        const f = card.querySelector(".shot img.f"), b = card.querySelector(".shot img.b"), n = card.querySelector("[data-cnote]");
        if (o.dataset.front && f) f.src = o.dataset.front;
        if (o.dataset.back && b) b.src = o.dataset.back;
        if (n && o.dataset.note) n.textContent = o.dataset.note;
        if (stock) applyStock();
      });
    });
  }

  // Members-only items: after "Add to basket", ask once per page visit whether the buyer is a
  // current member. "No" takes the item back out of the basket and explains why.
  let memberConfirmed = false;
  function askMember(product, id) {
    const m = $("#mcard");
    m.innerHTML =
      '<div class="mhead"><h3>Current members only</h3><button class="dclose" id="mClose" aria-label="Close">&times;</button></div>' +
      '<div class="mbody">' +
        '<p>The ' + esc(product) + ' is only for <b>current members</b> of Jesus College Boat Club.</p>' +
        '<p style="color:var(--ink);font-weight:700;font-size:1.05rem;margin-top:14px">Are you a current JCBC member?</p>' +
        '<div style="display:flex;gap:10px;margin-top:18px">' +
          '<button class="btn btn-primary" id="memYes" style="flex:1">Yes, I am a member</button>' +
          '<button class="btn btn-dark" id="memNo" style="flex:1">No</button>' +
        '</div>' +
      '</div>';
    $("#bkModal").classList.add("open");
    const no = () => {
      setQty(id, -1);
      m.innerHTML =
        '<div class="mhead"><h3>Not added</h3><button class="dclose" id="mClose" aria-label="Close">&times;</button></div>' +
        '<div class="mbody">' +
          '<p>Sorry, the ' + esc(product) + ' can only be bought by current members of Jesus College Boat Club, so it has been taken out of your basket.</p>' +
          '<p style="margin-top:10px">If you would like to join the club, have a look at <a class="inl" href="join.html">Row for Jesus</a>.</p>' +
          '<button class="btn btn-dark" id="mDone" style="width:100%;margin-top:18px">OK</button>' +
        '</div>';
      $("#mClose").onclick = closeAll; $("#mDone").onclick = closeAll;
    };
    $("#mClose").onclick = no;   // closing without answering counts as "no"
    $("#memNo").onclick = no;
    $("#memYes").onclick = () => { memberConfirmed = true; $("#bkModal").classList.remove("open"); openDrawer(); };
  }

  const idOf = i => i.name + "||" + (i.size || "");

  /* ---------- limited stock (STOCK in the Apps Script; GET orderEndpoint returns what is left) ---------- */
  // Keys are the names the order sends: "<h3> · <colour> (<size>)". Items not in the map are unlimited.
  let stock = null;
  const keyOf = i => i.size ? i.name + " (" + i.size + ")" : i.name;
  const inBasket = k => basket.filter(i => keyOf(i) === k).reduce((n, i) => n + i.qty, 0);
  const limited = k => !!stock && Object.prototype.hasOwnProperty.call(stock, k);
  const canAdd = k => !limited(k) || inBasket(k) < stock[k];
  function fetchStock() {
    if (!SHOP_CONFIG.orderEndpoint) return Promise.resolve(null);
    return fetch(SHOP_CONFIG.orderEndpoint, { cache: "no-store" })
      .then(r => r.json()).then(d => (d && d.ok && d.remaining) ? d.remaining : null).catch(() => null);
  }
  function loadStock() { fetchStock().then(r => { if (r) { stock = r; applyStock(); } }); }
  // Label sizes "sold out" / "only N left", disable sold-out sizes, grey a card out when
  // every size is gone, and trim basket items that are no longer available.
  function applyStock() {
    $$(".product").forEach(card => {
      const sel = card.querySelector("select.size");
      if (!sel || card.classList.contains("soldout")) return;
      const colSel = card.querySelector("select.colour");
      const base = $("h3", card).textContent.trim() + (colSel && colSel.value ? " · " + colSel.value : "");
      let any = false, open = 0;
      $$("option", sel).forEach(o => {
        if (!o.value) return;
        const k = base + " (" + o.value + ")";
        if (!limited(k)) { open++; return; }
        any = true;
        if (!o.dataset.label) o.dataset.label = o.textContent;
        const n = stock[k];
        o.disabled = n <= 0;
        o.textContent = o.dataset.label + (n <= 0 ? " · sold out" : n <= 5 ? " · only " + n + " left" : "");
        if (n > 0) open++;
        if (o.disabled && o.selected) sel.value = "";
      });
      if (any && !open) soldOut(card);
    });
    let trimmed = [];
    basket.forEach(i => {
      const k = keyOf(i);
      if (limited(k) && i.qty > stock[k]) { trimmed.push(i); i.qty = stock[k]; }
    });
    if (trimmed.length) {
      basket = basket.filter(i => i.qty > 0); save(); render();
      notice("Basket updated", "Some sizes have sold out since you added them, so your basket has been updated: " +
        trimmed.map(i => esc(i.name) + (i.size ? " (" + esc(i.size) + ")" : "")).join(", ") +
        ". Nothing has been ordered yet: please check your basket before you check out.");
    }
  }
  function soldOut(p) {
    p.classList.add("soldout");
    const shot = $(".shot", p);
    if (shot && !$(".soldstamp", shot)) shot.insertAdjacentHTML("beforeend", '<span class="soldstamp">Sold out</span>');
    $$("select, button:not([data-flip])", p).forEach(el => { el.disabled = true; });
    const add = $(".padd", p);
    if (add) add.textContent = "Sold out";
  }
  function noStockMsg(name, size, k) {
    const n = stock[k];
    return n <= 0 ? "Sorry, the " + esc(name) + " in size " + esc(size) + " is sold out."
      : "Sorry, there " + (n === 1 ? "is only 1" : "are only " + n) + " left in size " + esc(size) +
        ", and " + (n === 1 ? "it is" : "they are all") + " already in your basket.";
  }
  function notice(title, html) {
    const m = $("#mcard");
    m.innerHTML =
      '<div class="mhead"><h3>' + esc(title) + '</h3><button class="dclose" id="mClose" aria-label="Close">&times;</button></div>' +
      '<div class="mbody"><p>' + html + '</p>' +
        '<button class="btn btn-dark" id="mDone" style="width:100%;margin-top:18px">OK</button></div>';
    $("#bkModal").classList.add("open");
    $("#mClose").onclick = closeAll; $("#mDone").onclick = closeAll;
  }
  function addItem(name, price, size, close, members) {
    size = size || "";
    const ex = basket.find(i => i.name === name && (i.size || "") === size);
    if (ex) ex.qty += 1; else basket.push({ name, price, size, qty: 1, close: close || SHOP_CONFIG.closeDate, members: !!members });
    save(); render();
  }
  function setQty(id, d) {
    const it = basket.find(i => idOf(i) === id);
    if (!it) return;
    if (d > 0 && !canAdd(keyOf(it))) {
      const box = $("#ditems"), k = keyOf(it);
      const msg = document.createElement("div");
      msg.className = "dempty"; msg.style.padding = "10px 0"; msg.style.color = "var(--crimson)";
      msg.textContent = stock[k] === 1 ? "Only 1 left in this size." : "Only " + stock[k] + " left in this size.";
      if (box) { box.appendChild(msg); setTimeout(() => msg.remove(), 2500); }
      return;
    }
    it.qty += d;
    if (it.qty <= 0) basket = basket.filter(i => idOf(i) !== id);
    save(); render();
  }
  function removeItem(id) { basket = basket.filter(i => idOf(i) !== id); save(); render(); }
  const total = () => basket.reduce((s, i) => s + i.price * i.qty, 0);
  const count = () => basket.reduce((s, i) => s + i.qty, 0);

  // drop basket items whose own deadline has passed (e.g. trackies after their close)
  function prune() {
    const n = basket.length;
    basket = basket.filter(i => !i.close || !past(i.close));
    if (basket.length !== n) save();
  }

  /* ---------- render ---------- */
  function render() {
    prune();
    const badge = $("#basketCount");
    if (badge) badge.textContent = count();
    const items = $("#ditems"), foot = $("#dfoot");
    if (!items) return;
    if (!basket.length) {
      items.innerHTML = '<div class="dempty">Your basket is empty.<br>Add some stash to get started.</div>';
      foot.innerHTML = "";
      return;
    }
    items.innerHTML = basket.map(function (i) {
      var id = esc(idOf(i));
      return '<div class="ditem">' +
        '<div><div class="dn">' + esc(i.name) + (i.size ? ' <span class="dsize">' + esc(i.size) + '</span>' : '') + '</div>' +
        '<div class="dp">' + money(i.price) + ' each</div>' +
        '<button class="dremove" data-rm="' + id + '">Remove</button></div>' +
        '<div style="text-align:right">' +
          '<div class="qty"><button data-dec="' + id + '">−</button><span>' + i.qty + '</span><button data-inc="' + id + '">+</button></div>' +
          '<div class="line">' + money(i.price * i.qty) + '</div>' +
        '</div>' +
      '</div>';
    }).join("");
    foot.innerHTML =
      '<div class="sub"><span>Subtotal</span><span>' + money(total()) + '</span></div>' +
      '<button class="btn btn-primary" id="goCheckout">Checkout</button>' +
      '<div class="dnote">' + (payLater() ? 'Payment is by bank transfer; the treasurer will email you the details.' : 'Payment is by bank transfer; details are shown at checkout.') + '</div>';
    $$("[data-inc]", items).forEach(b => b.onclick = () => setQty(b.dataset.inc, 1));
    $$("[data-dec]", items).forEach(b => b.onclick = () => setQty(b.dataset.dec, -1));
    $$("[data-rm]", items).forEach(b => b.onclick = () => removeItem(b.dataset.rm));
    $("#goCheckout").onclick = checkoutDetails;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- drawer open/close ---------- */
  function openDrawer() { if (closed()) return; $("#drawer").classList.add("open"); $("#bkOverlay").classList.add("open"); }
  function closeAll() { $("#drawer").classList.remove("open"); $("#bkOverlay").classList.remove("open"); $("#bkModal").classList.remove("open"); }

  /* ---------- checkout: step 1 details ---------- */
  function checkoutDetails() {
    prune();
    if (!basket.length || closed()) { render(); return; }
    // Items from a [data-members-only] section: only current members can check out.
    const membersOnly = basket.some(i => i.members);
    const m = $("#mcard");
    m.innerHTML =
      '<div class="mhead"><h3>Checkout</h3><button class="dclose" id="mClose">&times;</button></div>' +
      '<div class="mbody">' +
        '<div class="msteps"><div class="s on"></div><div class="s"></div><div class="s"></div></div>' +
        '<p>Just a few details so we can match your transfer. All orders are picked up from the boathouse.</p>' +
        '<div class="field"><label>Full name</label><input id="f_name" autocomplete="name"></div>' +
        '<div class="field"><label>Email (for your receipt)</label><input id="f_email" type="email" autocomplete="email"></div>' +
        '<div class="field row">' +
          '<div><label>Connection to JCBC</label><select id="f_conn">' +
            (membersOnly ? '<option selected>Current member</option>' :
            '<option value="" disabled selected>Choose…</option>' +
            '<option>Current member</option><option>Alumni</option>' +
            '<option>Fan / supporter</option><option>Other</option>') + '</select></div>' +
          '<div><label>Collection</label><div class="fixedopt">Pick up from the boathouse</div></div>' +
        '</div>' +
        (membersOnly ? '<p style="font-size:.86rem;color:var(--crimson);font-weight:700">Your basket has members-only items: only current JCBC members can place this order.</p>' : '') +
        '<div class="field" id="f_crewwrap"' + (membersOnly ? '' : ' hidden') + '><label>Crew (optional)</label><input id="f_crew" placeholder="e.g. M1, W2, novice"></div>' +
        '<div class="field"><label>Notes (optional)</label><textarea id="f_notes" rows="2" placeholder="Anything else we should know?"></textarea></div>' +
        '<div class="err" id="f_err">Please enter your name, a valid email and your connection to JCBC.</div>' +
        '<button class="btn btn-primary" id="toBank" style="width:100%">' + (payLater() ? 'Continue' : 'Continue to payment') + '</button>' +
      '</div>';
    $("#bkModal").classList.add("open");
    $("#mClose").onclick = closeAll;
    $("#f_conn").onchange = () => { $("#f_crewwrap").hidden = $("#f_conn").value !== "Current member"; };
    $("#toBank").onclick = () => {
      const name = $("#f_name").value.trim();
      const email = $("#f_email").value.trim();
      const conn = $("#f_conn").value;
      if (!name || !conn || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("#f_err").classList.add("show"); return; }
      const crewTxt = conn === "Current member" ? $("#f_crew").value.trim() : "";
      checkoutBank({
        name, email,
        crew: crewTxt ? conn + " (" + crewTxt + ")" : conn,
        deliver: "Pick up from the boathouse",
        notes: $("#f_notes").value.trim()
      });
    };
  }

  /* ---------- checkout: step 2 bank transfer ---------- */
  function genRef(name) {
    const init = (name.match(/\b\w/g) || ["X"]).join("").slice(0, 3).toUpperCase();
    return "JCBC-" + init + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  function checkoutBank(cust) {
    cust.ref = genRef(cust.name);
    const b = SHOP_CONFIG.bank;
    const m = $("#mcard");
    if (payLater()) {
      m.innerHTML =
        '<div class="mhead"><h3>Confirm your order</h3><button class="dclose" id="mClose">&times;</button></div>' +
        '<div class="mbody">' +
          '<div class="msteps"><div class="s on"></div><div class="s on"></div><div class="s"></div></div>' +
          '<div class="bankbox">' +
            '<div class="brow"><span>Total</span><b>' + money(total()) + '</b></div>' +
            '<div class="brow"><span>Collection</span><b>Pick up from the boathouse</b></div>' +
            '<div class="brow"><span>Your reference</span><b class="ref">' + cust.ref + '</b></div>' +
          '</div>' +
          '<p style="font-size:.86rem">Place your order now. The treasurer will email you the club&#x27;s bank details; please pay by bank transfer using your reference so we can match your payment. You&#x27;ll get a receipt by email.</p>' +
          '<div class="err" id="p_err">Something went wrong sending your order. Please email us instead.</div>' +
          '<button class="btn btn-primary" id="placeOrder" style="width:100%">Place order</button>' +
        '</div>';
      $("#mClose").onclick = closeAll;
      $("#placeOrder").onclick = () => placeOrder(cust);
      return;
    }
    m.innerHTML =
      '<div class="mhead"><h3>Pay by bank transfer</h3><button class="dclose" id="mClose">&times;</button></div>' +
      '<div class="mbody">' +
        '<div class="msteps"><div class="s on"></div><div class="s on"></div><div class="s"></div></div>' +
        '<p>Please transfer <b>' + money(total()) + '</b> to the boat club, using your reference so we can match it:</p>' +
        '<div class="bankbox">' +
          '<div class="brow"><span>Account name</span><b>' + esc(b.name) + '</b></div>' +
          '<div class="brow"><span>Sort code</span><b>' + esc(b.sortCode) + '</b></div>' +
          '<div class="brow"><span>Account number</span><b>' + esc(b.accountNumber) + '</b></div>' +
          '<div class="brow"><span>Amount</span><b>' + money(total()) + '</b></div>' +
          '<div class="brow"><span>Payment reference</span><b class="ref">' + cust.ref + '</b></div>' +
        '</div>' +
        '<p style="font-size:.86rem">Once you’ve made the transfer, place your order below. You’ll get a receipt by email, and we’ll let you know when your order is ready to pick up from the boathouse.</p>' +
        '<div class="err" id="p_err">Something went wrong sending your order. Please email us instead.</div>' +
        '<button class="btn btn-primary" id="placeOrder" style="width:100%">I’ve made the transfer: place order</button>' +
      '</div>';
    $("#mClose").onclick = closeAll;
    $("#placeOrder").onclick = () => placeOrder(cust);
  }

  /* ---------- step 3: submit order ---------- */
  function placeOrder(cust) {
    const btn = $("#placeOrder");
    btn.textContent = "Placing order…"; btn.disabled = true;
    // Last check: has anything sold out since the page loaded? (The Apps Script checks again.)
    fetchStock().then(r => {
      if (r) {
        stock = r;
        const over = basket.filter(i => limited(keyOf(i)) && inBasket(keyOf(i)) > stock[keyOf(i)]);
        if (over.length) {
          applyStock();
          const e = $("#p_err");
          if (e) { e.textContent = "Sorry, part of your order has just sold out, so your basket has been updated. Nothing has been ordered: please check your basket and order again."; e.classList.add("show"); }
          btn.textContent = "Order not placed"; return;
        }
      }
      sendOrder(cust);
    });
  }
  function sendOrder(cust) {
    const order = {
      ref: cust.ref, date: new Date().toISOString(),
      name: cust.name, email: cust.email, crew: cust.crew,
      delivery: cust.deliver, notes: cust.notes,
      items: basket.map(i => ({ name: i.size ? i.name + " (" + i.size + ")" : i.name, qty: i.qty, price: i.price })),
      total: total(), bank: SHOP_CONFIG.bank.name,
      payBy: payBy()
    };

    const done = () => { basket = []; save(); render(); confirmScreen(cust); };

    if (SHOP_CONFIG.orderEndpoint) {
      fetch(SHOP_CONFIG.orderEndpoint, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(order)
      }).then(done).catch(() => { fallbackEmail(order); done(); });
    } else {
      fallbackEmail(order);
      done();
    }
  }

  // Earliest deadline among the basket items, for the receipt's "pay by" text.
  function payBy() {
    const d = new Date(basket.map(i => i.close || SHOP_CONFIG.closeDate)
      .sort((a, b) => new Date(a) - new Date(b))[0]);
    return {
      text: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) +
            " (" + d.toTimeString().slice(0, 5) + ")",
      short: d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })
    };
  }

  // No backend configured: open the customer's email app pre-filled.
  function fallbackEmail(order) {
    const lines = order.items.map(i => "  " + i.qty + " x " + i.name + " (" + money(i.price) + ")").join("\n");
    const body =
      "New JCBC shop order\n\nReference: " + order.ref +
      "\nName: " + order.name + "\nEmail: " + order.email +
      "\nConnection to JCBC: " + order.crew + "\nDelivery: " + order.delivery +
      "\nNotes: " + order.notes + "\n\nItems:\n" + lines +
      "\n\nTotal: " + money(order.total) +
      "\n\nI will pay by bank transfer using reference " + order.ref + ".";
    const url = "mailto:" + SHOP_CONFIG.treasurerEmail +
      "?subject=" + encodeURIComponent("Shop order " + order.ref) +
      "&body=" + encodeURIComponent(body);
    window.location.href = url;
  }

  function confirmScreen(cust) {
    const m = $("#mcard");
    m.innerHTML =
      '<div class="mhead"><h3>Order placed</h3><button class="dclose" id="mClose">&times;</button></div>' +
      '<div class="mbody"><div class="msteps"><div class="s on"></div><div class="s on"></div><div class="s on"></div></div>' +
        '<div class="mok"><div class="tick">✓</div>' +
        '<p style="color:var(--ink);font-weight:700;font-size:1.05rem">Thank you, ' + esc(cust.name.split(" ")[0]) + '!</p>' +
        '<p>Your reference is <b style="color:var(--crimson)">' + cust.ref + '</b>. ' +
        (payLater() ? 'The treasurer will email you the bank details; please pay using that reference. ' : 'Please make your bank transfer with that reference if you haven’t already. ') +
        'A receipt is on its way to <b>' + esc(cust.email) + '</b>.</p></div>' +
        '<button class="btn btn-dark" id="mDone" style="width:100%">Done</button>' +
      '</div>';
    $("#mClose").onclick = closeAll;
    $("#mDone").onclick = closeAll;
  }

  /* ---------- product photos (front/back) + size guide ---------- */
  function wireExtras() {
    // front/back photo toggle: the button or a tap on the photo switches sides
    $$(".shot.photo").forEach(shot => {
      const b = shot.querySelector("[data-flip]");
      if (!b) return;
      const labels = [b.textContent, b.dataset.flipAlt || "View front"];
      const flip = e => {
        e.preventDefault();
        const back = shot.classList.toggle("back");
        b.textContent = back ? labels[1] : labels[0];
        b.setAttribute("aria-pressed", back);
      };
      b.addEventListener("click", flip);
      shot.querySelectorAll("img").forEach(i => i.addEventListener("click", flip));
    });
    const open = d => { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); };
    const shut = d => { if (d.close) d.close(); else d.removeAttribute("open"); };
    $$("[data-size-guide]").forEach(b => b.addEventListener("click", e => {
      const d = document.getElementById(b.dataset.sizeGuide || "sizeGuide");
      if (d) { e.preventDefault(); open(d); }
    }));
    $$("dialog.sg").forEach(dlg => {
      $$("[data-sg-close]", dlg).forEach(b => b.addEventListener("click", () => shut(dlg)));
      dlg.addEventListener("click", e => { if (e.target === dlg) shut(dlg); });   // click on backdrop
      let fit = "m", unit = "cm";
      const show = () => {
        $$("[data-sg-panel]", dlg).forEach(p => { p.hidden = p.dataset.sgPanel !== fit + "-" + unit; });
        $$("[data-sg-tab]", dlg).forEach(b => b.classList.toggle("on", b.dataset.sgTab === fit));
        $$("[data-sg-unit]", dlg).forEach(b => b.classList.toggle("on", b.dataset.sgUnit === unit));
      };
      $$("[data-sg-tab]", dlg).forEach(b => b.addEventListener("click", () => { fit = b.dataset.sgTab; show(); }));
      $$("[data-sg-unit]", dlg).forEach(b => b.addEventListener("click", () => { unit = b.dataset.sgUnit; show(); }));
      show();
    });
  }

  /* ---------- closed state ---------- */
  // After the deadline: grey out every product, stamp it "Sold out", disable its controls.
  function applyClosed() {
    const all = closed();
    if (all) document.body.classList.add("shop-closed");
    $$(".product").forEach(p => {
      if (!all && !past(closeOf(p))) return;
      p.classList.add("soldout");
      const shot = $(".shot", p);
      if (shot && !$(".soldstamp", shot)) shot.insertAdjacentHTML("beforeend", '<span class="soldstamp">Sold out</span>');
      $$("select, button", p).forEach(el => { el.disabled = true; });
      const add = $(".padd", p);
      if (add) add.textContent = "Sold out";
    });
  }

  /* ---------- init ---------- */
  function init() {
    ui(); banner(); wireProducts(); wireColours(); wireExtras(); countdown(); applyClosed(); render();
    if (!closed()) loadStock();
    const bb = $("#basketBtn");
    if (bb) bb.addEventListener("click", openDrawer);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
