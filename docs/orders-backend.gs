/* ============================================================
   JCBC SHOP — orders backend (Google Apps Script)
   ------------------------------------------------------------
   This receives orders from shop.js, appends them to a Google
   Sheet, and emails the customer a receipt (BCC to treasurer).

   SETUP (see SHOP-SETUP.md for the full walkthrough):
   1. Create a Google Sheet to hold orders.
   2. Extensions ▸ Apps Script, delete the sample, paste this file.
   3. Edit TREASURER_EMAIL below.
   4. Deploy ▸ New deployment ▸ type "Web app" ▸ execute as you ▸
      access "Anyone". Copy the Web app URL.
   5. Paste that URL into shop.js  ->  SHOP_CONFIG.orderEndpoint
   ============================================================ */

var TREASURER_EMAIL = "jcbc-treasurer@jcsu.jesus.cam.ac.uk";
var SHEET_NAME = "Orders";
// Second stash officer, copied (visible CC) on every receipt
var STASH_CC = "wsg22@cam.ac.uk";
// Fallback payment deadline for the receipt (keep in step with closeDate in shop.js).
// shop.js v16+ sends order.payBy = { text, short }: the earliest deadline among the
// items ordered (trackies close earlier than jackets), which is used instead.
var DEADLINE_TEXT = "Friday 6 November 2026 (20:00)";
var DEADLINE_SHORT = "6 November";
var BANK = { name: "Jesus College Boat Club", sortCode: "30-91-56", accountNumber: "00538948" };

// Limited stock. Keys are the item names exactly as shop.js sends them:
// "<card h3> · <colour> (<size>)". Every order row counts against the stock unless its
// Status (column J) contains CANCEL, DROP, REFUND or SOLD OUT. Items not listed here are unlimited.
// shop.js reads what is left with a GET request (doGet) and greys out sold-out sizes.
var STOCK = {
  "Novice T-shirt · Black (S)": 30,
  "Novice T-shirt · Black (M)": 30,
  "Novice T-shirt · Black (L)": 26,
  "Novice T-shirt · Black (XL)": 5,
  "Novice T-shirt · Black (2XL)": 0
};

// GET <web app URL>  ->  { ok: true, remaining: { "<item name>": n, ... } }
function doGet(e) {
  try {
    return json({ ok: true, remaining: remainingStock(ordersSheet()) });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var order = JSON.parse(e.postData.contents);
    // One order at a time, so two buyers cannot both take the last shirt.
    lock.waitLock(30000);
    var short = shortfall(order, remainingStock(ordersSheet()));
    if (short.length) {
      appendToSheet(order, "SOLD OUT - not ordered");
      lock.releaseLock();
      sendSoldOut(order, short);
      return json({ ok: false, soldOut: short, ref: order.ref });
    }
    appendToSheet(order);
    lock.releaseLock();
    sendReceipt(order);
    return json({ ok: true, ref: order.ref });
  } catch (err) {
    try { lock.releaseLock(); } catch (e2) {}
    return json({ ok: false, error: String(err) });
  }
}

function ordersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME);
}

// Quantities already ordered for each limited item (column G "Items", column J "Status").
function soldCounts(sh) {
  var sold = {};
  if (!sh || sh.getLastRow() < 2) return sold;
  var rows = sh.getRange(2, 7, sh.getLastRow() - 1, 4).getValues();
  rows.forEach(function (r) {
    if (/CANCEL|DROP|REFUND|SOLD OUT/i.test(String(r[3]))) return;
    String(r[0]).split("; ").forEach(function (part) {
      var m = part.match(/^(\d+) x (.+)$/);
      if (m && STOCK.hasOwnProperty(m[2])) sold[m[2]] = (sold[m[2]] || 0) + Number(m[1]);
    });
  });
  return sold;
}

function remainingStock(sh) {
  var sold = soldCounts(sh), left = {};
  Object.keys(STOCK).forEach(function (k) { left[k] = Math.max(0, STOCK[k] - (sold[k] || 0)); });
  return left;
}

// Items in the order that ask for more than is left: [{ name, wanted, left }]
function shortfall(order, left) {
  var want = {};
  (order.items || []).forEach(function (i) {
    if (STOCK.hasOwnProperty(i.name)) want[i.name] = (want[i.name] || 0) + Number(i.qty);
  });
  return Object.keys(want).filter(function (k) { return want[k] > left[k]; })
    .map(function (k) { return { name: k, wanted: want[k], left: left[k] }; });
}

function appendToSheet(order, status) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Timestamp", "Reference", "Name", "Email", "College/Crew",
                  "Delivery", "Items", "Total (GBP)", "Notes", "Status"]);
    sh.getRange(1, 1, 1, 10).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  var items = (order.items || []).map(function (i) { return i.qty + " x " + i.name; }).join("; ");
  sh.appendRow([new Date(), order.ref, order.name, order.email, order.crew,
                order.delivery, items, order.total, order.notes, status || "PENDING"]);
  // Hand-over columns for the new row (never block the receipt if this fails).
  if (!status) { try { writeHandover(sh, sh.getLastRow(), items); } catch (e) {} }
  // newest order is easy to spot; you can mark Status -> PAID / POSTED as you go.
}

/* ---------- hand-over columns (stash officers tick when an item is given out) ----------
   From column O, one pair per item line of the order: "Item n" (e.g. "1 x Unisuit · Black (Women's M)")
   and "Given n" (tick box). Columns K-N (Date Paid, Paid, notes, Stash received) are kept by hand and
   never touched. New orders get their pairs in appendToSheet; run setupHandover() once from the editor
   to fill in the orders that were already in the sheet. */
var HANDOVER_COL = 15;   // column O

function writeHandover(sh, row, itemsText) {
  var items = String(itemsText || "").split("; ").filter(function (x) { return x; });
  if (!items.length) return;
  var head = sh.getRange(1, HANDOVER_COL, 1, 2 * items.length);
  var hv = head.getValues()[0];
  for (var k = 0; k < items.length; k++) {
    if (!hv[2 * k]) hv[2 * k] = "Item " + (k + 1);
    if (!hv[2 * k + 1]) hv[2 * k + 1] = "Given " + (k + 1);
  }
  head.setValues([hv]).setFontWeight("bold");
  for (var j = 0; j < items.length; j++) {
    sh.getRange(row, HANDOVER_COL + 2 * j).setValue(items[j]);
    sh.getRange(row, HANDOVER_COL + 2 * j + 1).insertCheckboxes();
  }
}

// Run from the editor: fill the hand-over columns for every existing order (skips blank rows, rows
// already done and "SOLD OUT - not ordered" rows), colour an item green once its box is ticked, and
// grey out and cross out a whole row once all its items are ticked. Safe to run again.
function setupHandover() {
  var sh = ordersSheet();
  var last = sh.getLastRow();
  if (last < 2) return;
  var rows = sh.getRange(2, 7, last - 1, 4).getValues();   // G Items .. J Status
  var done = sh.getRange(2, HANDOVER_COL, last - 1, 1).getValues();
  rows.forEach(function (r, i) {
    if (!r[0] || done[i][0] || /SOLD OUT/i.test(String(r[3]))) return;
    writeHandover(sh, i + 2, r[0]);
  });
  // Headers and colouring for at least 5 items, so bigger orders later are covered too.
  var pairs = Math.max(5, Math.floor((sh.getLastColumn() - HANDOVER_COL + 1) / 2));
  var head = sh.getRange(1, HANDOVER_COL, 1, 2 * pairs), hv = head.getValues()[0];
  for (var p = 0; p < pairs; p++) {
    if (!hv[2 * p]) hv[2 * p] = "Item " + (p + 1);
    if (!hv[2 * p + 1]) hv[2 * p + 1] = "Given " + (p + 1);
  }
  head.setValues([hv]).setFontWeight("bold");
  // Drop the rules this function made before, so running it again does not stack duplicates.
  var rules = sh.getConditionalFormatRules().filter(function (r) {
    var c = r.getBooleanCondition(), f = c ? String(c.getCriteriaValues()[0] || "") : "";
    return !/^=\$[A-Z]+2=TRUE$/.test(f) && f.indexOf("=AND(COUNTA($") !== 0;
  });
  // Whole row grey and crossed out once every item in it is ticked. Listed first, so it wins.
  var itemRefs = [], conds = [];
  for (var q = 0; q < pairs; q++) {
    var ic = sh.getRange(2, HANDOVER_COL + 2 * q).getA1Notation().replace(/\d+$/, "");
    var tc = sh.getRange(2, HANDOVER_COL + 2 * q + 1).getA1Notation().replace(/\d+$/, "");
    itemRefs.push("$" + ic + "2");
    conds.push("OR($" + ic + "2=\"\",$" + tc + "2=TRUE)");
  }
  rules.unshift(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=AND(COUNTA(" + itemRefs.join(",") + ")>0," + conds.join(",") + ")")
    .setBackground("#d9d9d9")
    .setFontColor("#7f7f7f")
    .setStrikethrough(true)
    .setRanges([sh.getRange(2, 1, sh.getMaxRows() - 1, HANDOVER_COL + 2 * pairs - 1)])
    .build());
  for (var k = 0; k < pairs; k++) {
    var itemCol = HANDOVER_COL + 2 * k;
    var tick = sh.getRange(2, itemCol + 1).getA1Notation().replace(/\d+$/, "");
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied("=$" + tick + "2=TRUE")
      .setBackground("#c8e6c9")
      .setRanges([sh.getRange(2, itemCol, sh.getMaxRows() - 1, 1)])
      .build());
  }
  sh.setConditionalFormatRules(rules);
}

function sendReceipt(order) {
  var payBy = order.payBy || {};
  var deadlineText = payBy.text || DEADLINE_TEXT;
  var deadlineShort = payBy.short || DEADLINE_SHORT;
  var total = "£" + Number(order.total).toFixed(2);
  var items = order.items || [];
  var lines = items.map(function (i) {
    return "  " + i.qty + " x " + i.name + ":  £" + (i.price * i.qty).toFixed(2);
  }).join("\n");

  // shop.js sends payBy = { none: true } when nothing in the order has a deadline.
  var warning = payBy.none ?
    "Please pay straight away by bank transfer, using your order reference. We only order items " +
    "that have been paid for, and we will not chase unpaid orders. For any questions about payment, " +
    "contact the treasurer at " + TREASURER_EMAIL + "." :
    "Please pay by " + deadlineText + ". We will only place the club order for items " +
    "that have been paid for by then. We will not chase unpaid orders: if your payment " +
    "has not arrived by the deadline, your order will be dropped and you will not receive " +
    "your stash. For any questions about payment, contact the treasurer at " + TREASURER_EMAIL + ".";
  var help = "Questions about your stash (sizes, colours, your order)? Just reply to this email.";

  // Plain-text version (for mail apps that don't show HTML)
  var body =
    "Hi " + order.name + ",\n\n" +
    "Thank you for your order with Jesus College Boat Club.\n\n" +
    "Order reference: " + order.ref + "\n\n" +
    lines + "\n\n" +
    "Total: " + total + "\n" +
    "Collection: " + order.delivery + "\n\n" +
    "Pay by bank transfer to:\n" +
    "  Account name: " + BANK.name + "\n" +
    "  Sort code: " + BANK.sortCode + "\n" +
    "  Account number: " + BANK.accountNumber + "\n" +
    "  Reference: " + order.ref + "\n\n" +
    "*** IMPORTANT: " + warning + " ***\n\n" +
    help + "\n\n" +
    "We'll let you know when your order is ready to pick up from the boathouse.\n\n" +
    "Boatie love,\nyour stash officers Amanda & Will";

  // HTML version with the highlighted deadline box
  var rows = items.map(function (i) {
    return "<tr><td style='padding:4px 12px 4px 0'>" + i.qty + " &times; " + esc(i.name) +
           "</td><td style='padding:4px 0;text-align:right'>&pound;" + (i.price * i.qty).toFixed(2) + "</td></tr>";
  }).join("");
  var html =
    "<div style='font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#171411;max-width:560px'>" +
    "<p>Hi " + esc(order.name) + ",</p>" +
    "<p>Thank you for your order with Jesus College Boat Club.</p>" +
    "<p><b>Order reference: <span style='color:#8A1218'>" + esc(order.ref) + "</span></b></p>" +
    "<table style='border-collapse:collapse;margin:8px 0'>" + rows +
    "<tr><td style='padding:8px 12px 4px 0;border-top:1px solid #ddd'><b>Total</b></td>" +
    "<td style='padding:8px 0 4px;border-top:1px solid #ddd;text-align:right'><b>" + total.replace("£", "&pound;") + "</b></td></tr></table>" +
    "<p>Collection: " + esc(order.delivery) + "</p>" +
    "<p style='margin-bottom:4px'><b>Pay by bank transfer to:</b></p>" +
    "<p style='margin-top:0'>Account name: " + BANK.name + "<br>Sort code: " + BANK.sortCode +
    "<br>Account number: " + BANK.accountNumber + "<br>Reference: <b>" + esc(order.ref) + "</b></p>" +
    "<div style='background:#FFF3B0;border-left:6px solid #8A1218;padding:14px 16px;margin:18px 0;font-weight:bold'>" +
    "IMPORTANT: " + esc(warning) + "</div>" +
    "<p>" + esc(help) + "</p>" +
    "<p>We'll let you know when your order is ready to pick up from the boathouse.</p>" +
    "<p>Boatie love,<br>your stash officers Amanda &amp; Will</p></div>";

  MailApp.sendEmail({
    to: order.email,
    cc: STASH_CC,
    bcc: TREASURER_EMAIL,
    subject: "Your JCBC order " + order.ref + (payBy.none ? " (please pay now)" : " (pay by " + deadlineShort + ")"),
    body: body,
    htmlBody: html
  });
}

// The order arrived after a size had sold out: nothing is ordered, so tell the buyer not to pay.
function sendSoldOut(order, short) {
  var list = short.map(function (s) {
    return s.name + ": you asked for " + s.wanted + ", " + (s.left ? "only " + s.left + " left" : "sold out");
  });
  var intro = "Sorry, part of your order sold out just before it reached us, so we have not placed it " +
    "and you should NOT pay for it. Please go back to the shop and order again with what is still available.";
  var body =
    "Hi " + order.name + ",\n\n" + intro + "\n\n" +
    list.map(function (l) { return "  " + l; }).join("\n") + "\n\n" +
    "Order reference (cancelled): " + order.ref + "\n\n" +
    "Questions? Just reply to this email.\n\n" +
    "Boatie love,\nyour stash officers Amanda & Will";
  var html =
    "<div style='font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#171411;max-width:560px'>" +
    "<p>Hi " + esc(order.name) + ",</p>" +
    "<div style='background:#FFF3B0;border-left:6px solid #8A1218;padding:14px 16px;margin:18px 0;font-weight:bold'>" +
    esc(intro) + "</div>" +
    "<ul>" + list.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>" +
    "<p>Order reference (cancelled): " + esc(order.ref) + "</p>" +
    "<p>Questions? Just reply to this email.</p>" +
    "<p>Boatie love,<br>your stash officers Amanda &amp; Will</p></div>";
  MailApp.sendEmail({
    to: order.email,
    cc: STASH_CC,
    bcc: TREASURER_EMAIL,
    subject: "Your JCBC order " + order.ref + " could not be placed (sold out)",
    body: body,
    htmlBody: html
  });
}

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
