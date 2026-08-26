# Moving the site to jesusboatclub.co.uk — checklist

Do these **in order**. Steps 1–2 must happen **before** you switch the domain, while the
old Wix site is still online, or some downloads will fail.

## 1. Pull in the files that were still hosted on Wix
The old site kept 13 PDFs and 11 photos (trustees + Steve Fairbairn) on Wix. The new
pages now point at local copies under `documents/` and `images/trustees/`, but the actual
files still need to be fetched from the live Wix site once:

```bash
bash docs/download-assets.sh
```

It prints `ok`/`FAIL` per file and a total at the end. If anything says FAIL, the old
site may be down or slow — re-run until all 24 succeed. Do this while jesusboatclub.co.uk
still shows the **old** site.

## 2. Commit everything
```bash
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null
git add -A
git commit -m "Localise all Wix-hosted PDFs and images; add CNAME; domain-move prep"
git push
```

## 3. Point the domain at GitHub Pages
- A `CNAME` file (contents: `www.jesusboatclub.co.uk`) is already in the repo.
- In the repo on GitHub: **Settings → Pages → Custom domain** — confirm it shows
  `www.jesusboatclub.co.uk` and tick **Enforce HTTPS** once it's available.
- At your DNS provider, point the domain at GitHub Pages:
  - `www` → CNAME record → `jesuscollegeboatclub.github.io`
  - apex `jesusboatclub.co.uk` → four A records to GitHub's IPs
    (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`), or an ALIAS/ANAME to the
    `github.io` host if your provider supports it.
- DNS can take up to ~24h. Until it propagates the old site may still show.

> If you'd rather use the bare `jesusboatclub.co.uk` (no `www`), change the one line in
> `CNAME` to `jesusboatclub.co.uk` and set the DNS the other way round.

## 4. After it goes live — quick check
Open each of these and confirm the PDF/photo loads (these are the migrated assets):
- Documents page → any "Download PDF"
- Trust page → trustee photos + the two forms
- Join page → the two brochure PDFs
- Sponsorship → brochure PDF
- Fairbairn Cup → Rules / Safety Plan / Coxes' Notes PDFs
- History → Steve Fairbairn photo

## Notes
- Everything from the old site is represented on the new one. The old Wix "copy-of-…"
  pages were unfinished drafts ("Description, pics, etc.") with no real content.
- One minor omission by choice: the old Archives page had a small image listing course
  **record times**; the new page instead notes records are displayed and updated in the
  boathouse. Add a records table later if you want it back.
- The old `/maps` page had three "where each division finishes" photos. The finish
  locations are covered in the course table on the Fairbairn Cup page; the photos
  themselves were not carried over.
