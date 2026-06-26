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
  closeDate: "2027-03-31T23:59:59",

  // Paste your deployed Apps Script Web App URL here to enable
  // email receipts + the orders spreadsheet. If left blank, the
  // "Place order" button falls back to opening an email instead.
  orderEndpoint: "https://script.google.com/macros/s/AKfycbwMM7VFwug1mS6cvLLJE2xrV1rIkwwC7NpGB6sBfntExJ9UBwVMGOJZFKW8kjmabwmstg/exec",

  // Where order notifications / fallback emails go.
  treasurerEmail: "jcbc-treasurer@jcsu.jesus.cam.ac.uk",

  // Bank details shown to customers for the transfer.  *** PLACEHOLDERS ***
  bank: {
    name: "Jesus College Boat Club",
    sortCode: "00-00-00",
    accountNumber: "00000000"
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

  let basket = [];
  try { basket = JSON.parse(localStorage.getItem(LS)) || []; } catch (e) { basket = []; }
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(basket)); } catch (e) {} };

  /* ---------- status banner under the hero ---------- */
  function banner() {
    const hero = $(".page-hero");
    if (!hero) return;
    const b = document.createElement("div");
    b.className = "shop-banner";
    const close = new Date(SHOP_CONFIG.closeDate);
    const fmt = close.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    if (closed()) {
      b.innerHTML = '<span class="dot"></span>The shop is now <b>closed</b> — thank you for your orders. It will reopen for the next stash drop.';
    } else {
      const days = Math.max(0, Math.ceil((close - new Date()) / 86400000));
      b.innerHTML = '<span class="dot"></span>Shop is <b>open</b> — orders close <b>' + fmt + '</b>' +
                    (days <= 60 ? ' &nbsp;·&nbsp; ' + days + ' day' + (days === 1 ? "" : "s") + ' left' : '');
    }
    hero.insertAdjacentElement("afterend", b);
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
        if (closed()) return;
        const card = btn.closest(".product");
        const name = $("h3", card).textContent.trim();
        const price = parseFloat(($(".pprice", card).textContent || "").replace(/[^0-9.]/g, "")) || 0;
        const sizeSel = card.querySelector("select.size");
        if (sizeSel && !sizeSel.value) { sizeSel.classList.add("needs"); sizeSel.focus(); setTimeout(() => sizeSel.classList.remove("needs"), 1200); return; }
        const size = sizeSel ? sizeSel.value : "";
        addItem(name, price, size);
        openDrawer();
        btn.textContent = "Added ✓";
        setTimeout(() => { btn.textContent = original; }, 1100);
      });
    });
  }

  const idOf = i => i.name + "||" + (i.size || "");
  function addItem(name, price, size) {
    size = size || "";
    const ex = basket.find(i => i.name === name && (i.size || "") === size);
    if (ex) ex.qty += 1; else basket.push({ name, price, size, qty: 1 });
    save(); render();
  }
  function setQty(id, d) {
    const it = basket.find(i => idOf(i) === id);
    if (!it) return;
    it.qty += d;
    if (it.qty <= 0) basket = basket.filter(i => idOf(i) !== id);
    save(); render();
  }
  function removeItem(id) { basket = basket.filter(i => idOf(i) !== id); save(); render(); }
  const total = () => basket.reduce((s, i) => s + i.price * i.qty, 0);
  const count = () => basket.reduce((s, i) => s + i.qty, 0);

  /* ---------- render ---------- */
  function render() {
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
      '<div class="dnote">Payment is by bank transfer — details shown at checkout.</div>';
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
    if (!basket.length || closed()) return;
    const m = $("#mcard");
    m.innerHTML =
      '<div class="mhead"><h3>Checkout</h3><button class="dclose" id="mClose">&times;</button></div>' +
      '<div class="mbody">' +
        '<div class="msteps"><div class="s on"></div><div class="s"></div><div class="s"></div></div>' +
        '<p>Just a few details so we can match your transfer and post your stash.</p>' +
        '<div class="field"><label>Full name</label><input id="f_name" autocomplete="name"></div>' +
        '<div class="field"><label>Email (for your receipt)</label><input id="f_email" type="email" autocomplete="email"></div>' +
        '<div class="field row">' +
          '<div><label>College / crew</label><input id="f_crew" placeholder="e.g. Jesus M1"></div>' +
          '<div><label>Delivery</label><select id="f_deliver"><option>Collect from boathouse</option><option>Post (UK)</option></select></div>' +
        '</div>' +
        '<div class="field"><label>Notes — colours, requests, etc.</label><textarea id="f_notes" rows="2" placeholder="Anything else we should know?"></textarea></div>' +
        '<div class="err" id="f_err">Please enter your name and a valid email.</div>' +
        '<button class="btn btn-primary" id="toBank" style="width:100%">Continue to payment</button>' +
      '</div>';
    $("#bkModal").classList.add("open");
    $("#mClose").onclick = closeAll;
    $("#toBank").onclick = () => {
      const name = $("#f_name").value.trim();
      const email = $("#f_email").value.trim();
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $("#f_err").classList.add("show"); return; }
      checkoutBank({
        name, email,
        crew: $("#f_crew").value.trim(),
        deliver: $("#f_deliver").value,
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
        '<p style="font-size:.86rem">Once you’ve made the transfer, place your order below. You’ll get a receipt by email, and we’ll post or set aside your stash once payment arrives.</p>' +
        '<div class="err" id="p_err">Something went wrong sending your order. Please email us instead.</div>' +
        '<button class="btn btn-primary" id="placeOrder" style="width:100%">I’ve made the transfer — place order</button>' +
      '</div>';
    $("#mClose").onclick = closeAll;
    $("#placeOrder").onclick = () => placeOrder(cust);
  }

  /* ---------- step 3: submit order ---------- */
  function placeOrder(cust) {
    const btn = $("#placeOrder");
    btn.textContent = "Placing order…"; btn.disabled = true;
    const order = {
      ref: cust.ref, date: new Date().toISOString(),
      name: cust.name, email: cust.email, crew: cust.crew,
      delivery: cust.deliver, notes: cust.notes,
      items: basket.map(i => ({ name: i.size ? i.name + " (" + i.size + ")" : i.name, qty: i.qty, price: i.price })),
      total: total(), bank: SHOP_CONFIG.bank.name
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

  // No backend configured: open the customer's email app pre-filled.
  function fallbackEmail(order) {
    const lines = order.items.map(i => "  " + i.qty + " x " + i.name + " (" + money(i.price) + ")").join("\n");
    const body =
      "New JCBC shop order\n\nReference: " + order.ref +
      "\nName: " + order.name + "\nEmail: " + order.email +
      "\nCollege/crew: " + order.crew + "\nDelivery: " + order.delivery +
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
        'Please make your bank transfer with that reference if you haven’t already. ' +
        'A receipt is on its way to <b>' + esc(cust.email) + '</b>.</p></div>' +
        '<button class="btn btn-dark" id="mDone" style="width:100%">Done</button>' +
      '</div>';
    $("#mClose").onclick = closeAll;
    $("#mDone").onclick = closeAll;
  }

  /* ---------- closed state ---------- */
  function applyClosed() {
    if (closed()) document.body.classList.add("shop-closed");
  }

  /* ---------- init ---------- */
  function init() {
    ui(); banner(); wireProducts(); applyClosed(); render();
    const bb = $("#basketBtn");
    if (bb) bb.addEventListener("click", openDrawer);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
