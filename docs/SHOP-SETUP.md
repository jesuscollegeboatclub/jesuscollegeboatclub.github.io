# JCBC Shop — how it works & setup

The shop now runs entirely in the browser, with one small backend for the
email receipts and the orders spreadsheet.

## The flow a customer sees

1. **Add to basket** — every product's button adds it to a basket that is
   saved in the customer's browser (so it survives a page refresh).
2. **Checkout** — they open the basket (top-right), review it, and enter
   their name, email, college/crew, delivery choice and any notes.
3. **Bank transfer** — they're shown the club's bank details and a unique
   **payment reference** (e.g. `JCBC-AS-4F9X`) to use, so you can match the
   transfer to the order.
4. **Place order** — the order is sent to the backend, which **emails them a
   receipt** and **adds a row to your orders spreadsheet**.
5. **Closing date** — after the date you set, the whole shop **greys out and
   locks**, and a banner says the shop is closed.

## What you must edit (in `assets/js/shop.js`, top of the file)

```js
const SHOP_CONFIG = {
  closeDate: "2027-03-31T23:59:59",   // when the shop greys out and closes
  orderEndpoint: "",                  // paste your Apps Script URL (step below)
  treasurerEmail: "jcbc-treasurer@jcsu.jesus.cam.ac.uk",
  bank: {
    name: "Jesus College Boat Club",
    sortCode: "00-00-00",             // <-- real sort code
    accountNumber: "00000000"         // <-- real account number
  },
  currency: "£"
};
```

If `orderEndpoint` is left blank, the shop still works: "Place order" opens
the customer's email app with the order pre-filled to the treasurer. Wiring
the backend below is what makes the receipt + spreadsheet automatic.

## Backend: email receipts + orders spreadsheet (Google, free)

1. Create a new **Google Sheet** (this becomes your orders log).
2. In it, go to **Extensions ▸ Apps Script**. Delete the sample code.
3. Paste in the contents of **`orders-backend.gs`** (included).
4. Change `TREASURER_EMAIL` at the top to the right address.
5. **Deploy ▸ New deployment ▸** select type **Web app**.
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click **Deploy**, authorise, and **copy the Web app URL**.
6. Paste that URL into `assets/js/shop.js` → `SHOP_CONFIG.orderEndpoint`.

Each order now appends a row (timestamp, reference, name, email, crew,
delivery, items, total, notes, and a blank "Payment received?" column you can
tick) and emails the customer a receipt, BCC'd to the treasurer.

## Putting this on the live Wix site

This prototype is plain HTML/CSS/JS. Two ways to use it on Wix:

- **Keep this checkout:** embed the shop page (or the basket script) via Wix's
  *Custom Code / Embed HTML*, and use the Google Apps Script backend above.
- **Use Wix Stores instead (recommended on Wix):** add the Wix Stores app,
  set the payment method to **Manual / bank transfer (offline payment)**, and
  turn on **Wix Automations** to email a receipt on new orders. Orders appear
  in your Wix dashboard and can be exported to a spreadsheet. To auto-close the
  shop, schedule the Stores page to unpublish, or mark products out of stock.

## Note on security

Never commit real bank details or the Apps Script URL to a public repo if you
don't want them public. For a college club bank transfer this is usually fine,
but keep it in mind.
