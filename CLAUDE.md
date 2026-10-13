# JCBC website: project memory

Read this before editing anything in this repo. It records how the site is built,
how it is published, how the shop works, and the house rules for content.
Humans: the same information, step by step, is in `docs/` (see the index at the end).

---

## 1. What this is

- The Jesus College Boat Club website: **plain HTML + CSS + JavaScript, no build step,
  no framework.** Every page is a standalone `.html` file in the repo root.
- Hosted on **GitHub Pages** from repo `jesuscollegeboatclub/jesuscollegeboatclub.github.io`,
  branch **`main`**, folder `/` (root).
- Live at **https://www.jesusboatclub.co.uk** (moved off Wix in October 2026).
- Local copy on the webmaster's Mac:
  `~/Desktop/Persons/Amanda/Rowing/webmaster/jcbc_website`.
- The git remote uses an SSH host alias: `git@github.com-jcbc:jesuscollegeboatclub/jesuscollegeboatclub.github.io.git`.

## 2. Publishing a change

```bash
cd ~/Desktop/Persons/Amanda/Rowing/webmaster/jcbc_website
rm -f .git/index.lock .git/HEAD.lock      # only needed if git complains about a lock
git add -A
git commit -m "Short summary of what changed"
git push
```

- GitHub Pages rebuilds about a minute after the push.
- **Claude cannot push** from its sandbox (outbound SSH is blocked). Claude edits the
  files; the human runs the commands above. Claude also cannot delete files in this
  folder without first asking for delete permission.
- If a change "doesn't show", it is almost always browser caching: hard refresh
  (Cmd+Shift+R) or a private window. See section 5 for cache-busting.

## 3. Domain, DNS and HTTPS

- `CNAME` file contains `www.jesusboatclub.co.uk`; `.nojekyll` disables Jekyll so files
  are served exactly as they are.
- The domain is **registered at Wix**, and Wix does not allow changing nameservers, so DNS is edited in
  Wix: *Domains → ⋯ → Manage DNS records*. Correct records:

  | Type  | Host                      | Value                              |
  |-------|---------------------------|------------------------------------|
  | A     | jesusboatclub.co.uk (@)   | 185.199.108.153                    |
  | A     | jesusboatclub.co.uk (@)   | 185.199.109.153                    |
  | A     | jesusboatclub.co.uk (@)   | 185.199.110.153                    |
  | A     | jesusboatclub.co.uk (@)   | 185.199.111.153                    |
  | CNAME | www                       | jesuscollegeboatclub.github.io     |

  These four IPs are GitHub Pages' published addresses. Leave the other CNAMEs
  (`fairbairns.`, `www.fairbairns.`, `m.`) alone; they still point at Wix (the old
  standalone Fairbairns site).
- Keep the Wix **domain** subscription on auto-renew; hosting itself is free on GitHub.
- HTTPS: repo **Settings → Pages** → custom domain `www.jesusboatclub.co.uk` → tick
  **Enforce HTTPS** once the certificate exists. `NET::ERR_CERT_COMMON_NAME_INVALID`
  means the certificate has not been issued yet. Wait, or clear and re-enter the custom domain.
- GitHub Pages serves `/foo` from `foo.html`. Old Wix URLs that are printed in race
  documents rely on this. **`/coxes-notes` must keep working** (it is in the Fairbairn
  rules). Never rename `coxes-notes.html`.

## 4. Pages

| File | Page | Menu location |
|------|------|---------------|
| `index.html` | Home | Home |
| `committee.html` | Committee | Club ▾ |
| `fleet.html` | Facilities & Fleet (incl. coaches) | Club ▾ |
| `sponsorship.html` | Sponsorship | Club ▾ |
| `trust.html` | The Trust + trustees | Club ▾ |
| `documents.html` | Governance & Documents | Club ▾ |
| `history.html` | History + timeline | Club ▾ |
| `fairbairns.html` | Fairbairn Cup overview | Fairbairn Cup ▾ Overview |
| `coxes-notes.html` | Coxes' Notes + redrawn maps | Fairbairn Cup ▾ |
| `fairbairn-archives.html` | Results archive | Fairbairn Cup ▾ |
| `fairbairn-history.html` | Fairbairn Cup history | Fairbairn Cup ▾ |
| `bicentenary.html` | 200 years (2026–27 events, books) | Bicentenary |
| `news.html` | News + Instagram feed | News |
| `join.html` | Row for Jesus (sign-up form, brochures) | Row for Jesus |
| `merch.html` | Shop (+ Bicentenary Books) | Shop |
| `contact.html` | Contact (role emails) | Contact |
| `credits.html` | Credits | footer only |

**The header (nav) and footer are copied into every page.** There is no include
system. Any menu or footer change must be applied to *all* `.html` files, and the
safest way to do it is a small script. On each page the current item carries
`class="active"` (and its dropdown trigger `ddtrigger active`). To add a page, copy an
existing page, replace the content between `</header>` and `<footer>`, fix `<title>`
and the active states, then add the link to every page's nav/footer.

## 5. Styling, scripts and cache-busting

- `assets/css/jcbc.css`: whole site. Brand variables at the top (`--crimson:#8A1218`,
  `--ink`, `--paper`, `--line` …). `assets/css/shop.css`: shop only.
- `assets/js/jcbc.js`: mobile menu, scroll-reveal, **shop switch** (section 7).
  `assets/js/shop.js`: basket and checkout.
- Every page links them with a version query, e.g. `jcbc.css?v=14`, `jcbc.js?v=9`,
  `shop.css?v=16`, `shop.js?v=10`. **After editing a CSS/JS file, bump its `?v=` on every
  page**, otherwise returning visitors keep the old file.
- Section background classes: `bg-paper`, `bg-paper2` (light), `bg-ink`, `bg-crimson`
  (dark). Reusable bits: `.card`, `.panel`, `.dl` (download/link card with `.ic`
  badge), `.btn btn-primary|btn-dark|btn-light|btn-ghost|btn-outline`, `.dtable`,
  `.timeline`, `details.doc` (collapsible document text), `.sec-head`, `.eyebrow`.

**Pitfalls already hit, so don't repeat them:**
- A CSS `url()` inside a custom property resolves relative to the *stylesheet*, so page
  hero backgrounds are set **inline** on the section
  (`style="background:url('images/x.jpg') center/cover no-repeat"`).
- White cards on dark sections inherit white text. Cards set `color:var(--ink)`
  explicitly. Check text colour whenever a section's background changes.
- The mobile menu dropdowns must use `visibility:inherit` (not `visible`), or the
  invisible closed menu captures taps.
- Never hot-link files from the old Wix host (`jesusboatclub.co.uk/_files/…`,
  `static.wixstatic.com`): store them in the repo and link relatively.

## 6. Images

- `images/`: page photos (already resized: max 1800 px wide, JPEG ~q80), crest
  `jesus_crest.png`, coaches `headcoach.jpg` / `assistantcoach.jpg`, books `book-*.jpg`.
- `images/committee/`: committee portraits, **named by role** (`president.jpg`,
  `captainwomen.jpg`, `lowerboatcaptainmen1.jpg` …; full table in `docs/PHOTO-GUIDE.md`).
  Replacing a photo = overwrite the file with the same name; no HTML change needed.
- `images/trustees/`: trustee photos. `images/fairbairns/`: redrawn course maps.
- Keep the site fast: never commit camera-size images. Convert new portraits to a
  700×700 square JPEG (crop biased toward the top for faces):
  ```python
  from PIL import Image, ImageOps
  im = ImageOps.exif_transpose(Image.open(SRC)).convert("RGB"); w, h = im.size
  im = im.crop((0, int((h-w)*0.18), w, int((h-w)*0.18)+w)) if h >= w else im.crop(((w-h)//2, 0, (w-h)//2+h, h))
  im.resize((700, 700), Image.LANCZOS).save(DST, "JPEG", quality=84, optimize=True, progressive=True)
  ```
- All `<img>` tags use `loading="lazy" decoding="async"`.

## 7. The shop

**Two switches, two different jobs:**

1. **`SHOP_LIVE`** at the top of `assets/js/jcbc.js` (currently `false`).
   - `false`: on `merch.html` the basket button and every product section are hidden
     and a "The shop is being restocked" notice is inserted. The **Shop link stays in
     the menu**, and any section with class **`shop-keep`** (the Bicentenary Books)
     stays visible above the notice.
   - `true`: full shop. Flip it only when there is real stash to sell.
2. **`SHOP_CONFIG`** at the top of `assets/js/shop.js`:
   - `closeDate`: order deadline. Currently `2026-11-01T23:59:59` (orders close Sunday
     1 November 2026). After it the shop greys out (`body.shop-closed`) and shows a
     "shop is closed" banner. The "Shop is open · orders close …" banner only appears
     while `SHOP_LIVE` is true (`window.JCBC_SHOP_LIVE`).
   - The jacket section has a crimson **deadline countdown** (`[data-countdown]` in
     `merch.html`, driven by `closeDate` via `countdown()` in `shop.js`; pulses in the last
     3 days, removed once closed). The banner turns crimson with "Last call" in the last
     14 days. Change the date text in the countdown block when `closeDate` changes.
   - `orderEndpoint`: URL of the deployed Google Apps Script web app (already set).
     If blank, "Place order" falls back to opening an email to the treasurer.
   - `treasurerEmail`: `jcbc-treasurer@jcsu.jesus.cam.ac.uk`.
   - `bank`: **sort code and account number are still placeholders (`00-00-00`,
     `00000000`)**. These must be the real details before `SHOP_LIVE = true`.

**Current range (Michaelmas 2026):** two Musto jackets in `merch.html#range`
(`.shop-grid.two`): **Sardinia** (£157.86, Black or Platinum; light mesh lining) and
**Corsica** (£165.06, Black only; brushed fleece lining, three zipped pockets). Both are
waterproof seam-sealed Ocean Tech with a hood that packs into the collar (verified on
musto.com, Oct 2026). Each card links the Musto men's/women's product pages (`.mlinks`;
SKUs 82617/82619 Sardinia, 82615/82618 Corsica). Prices are the supplier's per-unit cost
incl. VAT from the order spreadsheet. Photos in `images/shop/` (front + back, cut from the
supplier artwork PDF); hover or "View back" swaps to the back. There is **no Sardinia Black
artwork**, so both Sardinia colours show the Platinum images and the badge (`[data-cnote]`)
reads "Black · artwork shown in Platinum". If a black image arrives, save it as
`images/shop/sardinia-black-front/back.jpg` and point the Black option's `data-front`/
`data-back` at it. Each card has a `select.colour` (options may carry `data-front`,
`data-back`, `data-note` to swap the photos/badge) and a `select.size` with two
`optgroup`s: men's/unisex (XS S M MB L LB XL XXL 3XL) and women's (UK 8–18 with letter
size). The basket item is "<h3> · <colour>" with size e.g. "Men's L" or "Women's 12 (M)".
Every `[data-size-guide]` element opens the `<dialog id="sizeGuide">` (tabs: men's/women's ×
cm/inches; data copied from the supplier's charts). Shop photos deliberately have no
`loading="lazy"`/`decoding="async"`.

**Collection only:** there is no delivery option. Checkout shows a fixed
"Pick up from the boathouse" field and sends `delivery: "Pick up from the boathouse"`.

**How an order works:** product buttons (`.product .padd`) add to a basket stored in
`localStorage` (`jcbc_basket_v1`). The item name comes from the card's `<h3>`, the price
from `.pprice`, the colour from an optional `<select class="colour">` (appended to the
name) and the size from an optional `<select class="size">`; items can't be added until
every present select has a value. Checkout collects name/email/crew/notes (collection is fixed to the boathouse), then
shows the bank details and a reference `JCBC-<initials>-<4 chars>`. "Place order" POSTs
JSON to the Apps Script (`docs/orders-backend.gs`), which appends a row to the orders
Google Sheet (timestamp, reference, name, email, crew, delivery, items, total, notes,
"payment received?") and emails the customer a receipt BCC'd to the treasurer. Full
setup: `docs/SHOP-SETUP.md`.

**Adding or editing a product:** copy an `<article class="product">` block in
`merch.html#range`, change the `<h3>`, `.pdesc`, `.pprice`, the images, and keep or
remove the colour/size `<select>`s. The basket
reads everything from the HTML, so no JS change is needed.

## 8. Committee page

- **Edit `committee.html` directly.** (An old generator script existed during the
  rebuild but the page has been hand-edited since; regenerating would lose edits.)
- Card = `<article class="cm">` with `.pic` (image + optional email button) and `.ci`
  (role `.crole`, name `<h3>`, one or more `<p class="cbio">` paragraphs).
- **Email buttons (`.mailbtn`) only for the 8 role accounts that exist:**
  `jcbc-president@`, `jcbc-mcaptain@` (men's captain + men's vice-captain),
  `jcbc-wcaptain@` (women's captain + women's vice-captain), `jcbc-cox-captain@`,
  `jcbc-lbcaptains@` (all LBCs), `jcbc-fbsecretary@`, `jcbc-webmaster@` (all
  `@jcsu.jesus.cam.ac.uk`) and `boatman@jesus.cam.ac.uk` (coaches). **No personal
  `@cam.ac.uk` addresses anywhere on the site.** No invented addresses either.
- Photo disclaimer sticker: add `noted` to the `.cm` article and a
  `<div class="photonote"><span>…</span></div>` inside `.pic` (used for Ingrid).
- The President 2026–27 also appears on the home page (`index.html`, `.pres-card`).

## 9. Fairbairn Cup

- `fairbairns.html` anchors: `#info` (intro, provisional times), `#course` (finish
  table), `#maps` (map cards), `#raceday`, `#rules` (rules, safety plan, coxes' notes as
  `details.doc` summaries + PDF downloads). Dates and times are for a specific year
  and **must be updated each autumn**.
- `coxes-notes.html`: steering advice + the three redrawn maps (`images/fairbairns/*.svg`
  with PNG downloads). In the Fairbairn Cup dropdown.
- `maps/`: the webmaster's original map files (course map PDF, marshals map PNG,
  start-marshalling PNG, two editable PPTX). Linked as cards from `fairbairns.html#maps`.
- Redrawn maps: regenerate with `python3 docs/fairbairn-maps/make_maps.py` (river
  geometry in `river-centrelines.json`; all label/marker coordinates are at the bottom
  of the script). Then re-export PNGs:
  `convert -density 200 -background white -flatten X.svg X.png`.
- Race PDFs live in `documents/` (`fairbairn-rules-and-regulations-2025.pdf`,
  `fairbairn-safety-plan-2025.pdf`, `fairbairn-coxes-notes-2025.pdf`). When new versions
  arrive, either overwrite with the same filename or update the links in
  `fairbairns.html` and `coxes-notes.html`, and refresh the on-page summaries.
- Fairbairns Secretary for 2026 is Vova Chub (sign-off on the coxes' notes summary).
- Novice definition: no rower has rowed / no cox has coxed **before September** of the
  current year.

## 10. Other moving parts

- `join.html`: embedded Google Form (**JCBC Interest Form 2026**, id
  `1FAIpQLSdzTbKoRR1p0JruOTqflOAJJrekzTbYYXiEdlEkOO-ZIEr4PQ`, embed with
  `?embedded=true`), plus the medical-screening-form signpost and the two brochures.
- `news.html`: Instagram feed via Behold widget, `feed-id="isNXzkbczxjjM04jU1Ug"`;
  news cards newest first.
- `bicentenary.html`: four headline events copied from
  jesus.cam.ac.uk/events/jcbc-bicentenary-events-2026-2027, plus links to booking and
  the mailing list. Update when the College publishes new details.
- `documents/`: every PDF the site links (constitution, codes of conduct, safety plan,
  medical form, brochures, trust forms, Fairbairn PDFs). Governance pages show a
  plain-language summary **and** a PDF download.

## 11. Content house rules (from the webmaster)

- Committee bios: keep the member's submitted wording; fix only typos and grammar;
  always **first person**.
- Avoid em dashes in new copy the webmaster asks for (use commas or full stops).
- Say **"men's and open side"**, not "men's side".
- Keep the **Shop** in the menu at all times; `SHOP_LIVE` only hides the products.
- Don't publish anything obsolete just because it was on the old Wix site; the
  current page structure wins.
- Verify facts (people, dates, Olympic results etc.) before adding them; flag any
  assumption rather than guessing.

## 12. Docs index

- `docs/PHOTO-GUIDE.md`: committee photo filenames and roles, email table.
- `docs/SHOP-SETUP.md`: shop flow and Apps Script backend setup.
- `docs/orders-backend.gs`: the Apps Script code.
- `docs/MIGRATION.md`: the Wix → GitHub Pages move.
- `docs/fairbairn-maps/`: map generator.
- `docs/download-assets.sh`, `docs/download-images.sh`: one-off Wix migration scripts
  (only work while the old Wix files exist).
