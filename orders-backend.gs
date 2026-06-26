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

function doPost(e) {
  try {
    var order = JSON.parse(e.postData.contents);
    appendToSheet(order);
    sendReceipt(order);
    return json({ ok: true, ref: order.ref });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function appendToSheet(order) {
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
                order.delivery, items, order.total, order.notes, "PENDING"]);
  // newest order is easy to spot; you can mark Status -> PAID / POSTED as you go.
}

function sendReceipt(order) {
  var lines = (order.items || []).map(function (i) {
    return "  " + i.qty + " x " + i.name + "  —  £" + (i.price * i.qty).toFixed(2);
  }).join("\n");

  var body =
    "Hi " + order.name + ",\n\n" +
    "Thank you for your order with Jesus College Boat Club.\n\n" +
    "Order reference: " + order.ref + "\n\n" +
    lines + "\n\n" +
    "Total: £" + Number(order.total).toFixed(2) + "\n" +
    "Delivery: " + order.delivery + "\n\n" +
    "If you haven't already, please pay by bank transfer using your reference (" + order.ref + ") " +
    "so we can match your payment. We'll be in touch once it arrives.\n\n" +
    "Row for Jesus,\nJCBC";

  MailApp.sendEmail({
    to: order.email,
    bcc: TREASURER_EMAIL,
    subject: "Your JCBC order " + order.ref,
    body: body
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
