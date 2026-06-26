# Jesus College Boat Club — website

The JCBC website. Plain HTML, CSS and JavaScript — no build step. Hosted on
GitHub Pages (this repo is `jesuscollegeboatclub.github.io`).

## Folder overview

```
.
├── index.html              Home
├── fairbairns.html         Fairbairn Cup
├── fleet.html              Facilities & Fleet
├── committee.html          The Committee
├── history.html            History
├── join.html               Row for Jesus (joining info)
├── merch.html              Shop
├── contact.html            Contact
│
├── assets/
│   ├── css/                jcbc.css (whole site) · shop.css (shop only)
│   └── js/                 jcbc.js (nav, animations) · shop.js (basket/checkout)
│
├── images/                 All photos + the crest. Committee photos are named
│                           by role (see docs/PHOTO-GUIDE.md).
│
└── docs/                   Not part of the live site — setup & helpers:
    ├── SHOP-SETUP.md       How the shop + orders sheet work
    ├── orders-backend.gs   Google Apps Script for receipts + orders sheet
    ├── PHOTO-GUIDE.md      Which committee photo file is whom
    └── download-images.sh  Re-fetch all photos from the old Wix site
```

## Editing

- **Text / layout:** edit the relevant `.html` file.
- **Colours, fonts, spacing:** `assets/css/jcbc.css`. The brand red and other
  values are CSS variables at the very top (`:root { --crimson … }`).
- **Shop products / prices / sizes:** `merch.html`.
- **Shop settings** (bank details, close date, orders endpoint): the
  `SHOP_CONFIG` block at the top of `assets/js/shop.js`.
- **Committee photos:** drop a new image into `images/` over the matching file
  (keep the same name — see `docs/PHOTO-GUIDE.md`).

After changing CSS or JS, bump the `?v=` number on its `<link>`/`<script>` tag
in the HTML so browsers load the new version instead of a cached copy.

## Publishing changes

This repo *is* the live site, so publishing = pushing to GitHub:

```
git add -A
git commit -m "Describe your change"
git push
```

GitHub Pages redeploys automatically within a minute.

## The shop

Customers add items to a basket, check out, and are shown the club's bank
details with a unique reference. Orders are emailed as a receipt and appended
to a Google Sheet. Full setup (≈5 min) is in `docs/SHOP-SETUP.md`.
