# Committee photos — guide for future webmasters

All committee portraits live in **`images/committee/`** and are named by **role**, not by
person. That way, when the committee changes you only have to drop a new photo in
over the old one — no code changes needed.

## How to update a portrait

1. Crop/save the new photo (a **square** image works best — roughly 700×700px).
2. Save it into `images/committee/` using the **exact filename** from the table below
   (keep the `.jpg` extension, even if your original was a PNG — just rename it).
3. That's it. Refresh the page and the new photo appears.

If a name or bio changes too, edit `committee.html` — each person is a small block
containing their role, name and bio right next to their image filename.

## Filename → role

| File | Role | 2025–26 |
|------|------|---------|
| `president.jpg` | President | Emma Tabernacle |
| `captainmen.jpg` | Men's Captain | Thomas McCarter |
| `captainwomen.jpg` | Women's Captain | Katy Bradley |
| `coxingcaptain.jpg` | Coxing Captain | Arzoo Iqbal |
| `vicecaptainmen.jpg` | Men's Vice-Captain | Finn Foley |
| `vicecaptainwomen.jpg` | Women's Vice-Captain | Ingrid Berg |
| `lowerboatcaptainmen1.jpg` | Men's Lower Boats Captain | Will Sutcliffe |
| `lowerboatcaptainmen2.jpg` | Men's Lower Boats Captain | Archie Barrell |
| `lowerboatcaptainmen3.jpg` | Men's Lower Boats Captain | Theo Sturman |
| `lowerboatcaptainmen4.jpg` | Men's Lower Boats Captain | Freddie Metcalfe |
| `lowerboatcaptainwomen1.jpg` | Women's Lower Boats Captain | Amy Dunbavin |
| `lowerboatcaptainwomen2.jpg` | Women's Lower Boats Captain | Ellen Bridson |
| `lowerboatcaptainwomen3.jpg` | Women's Lower Boats Captain | Rachael Wilson |
| `lowerboatcaptainwomen4.jpg` | Women's Lower Boats Captain | Mimi Gu |
| `treasurer.jpg` | Treasurer | Jake Hawkes |
| `secretary.jpg` | Secretary | Madison Ross |
| `fairbairnssecretary.jpg` | Fairbairn's Secretary | Vova Chub |
| `webmaster.jpg` | Webmaster | Grace Skinner |
| `socialsecretary1.jpg` | Social Secretary | Amanda Stoffers |
| `socialsecretary2.jpg` | Social Secretary | Flynn Bizzell |
| `stashofficer2.jpg` | Stash Officer | Amanda Stoffers |
| `welfareofficer1.jpg` | Welfare Officer | Elena Ruddy |
| `welfareofficer2.jpg` | Welfare Officer | Marleen Wölke |
| `fundraisingofficer.jpg` | Fundraising Officer | Anastasia Slastikova |
| `alumnioutreach.jpg` | Alumni & Outreach Officer | Lucy Yeadon |
| `stashofficer1.jpg` | Stash Officer | Will Galloway |

Coaches and the boathouse dog use `images/headcoach.png`, `images/assistantcoach.png`
and `images/boathousedog.png`.

## Placeholders

If a member has no photo yet, use a claret square with their initials and the words
"PHOTO TO FOLLOW" saved under their role filename. As of October 2026 **every committee
member has a real photo**, so there are no placeholders.

Keep new photos small: a 700×700 square JPEG (see `CLAUDE.md`, section 6).

## A note on email addresses

Personal `@cam.ac.uk` addresses are deliberately **not** published on the committee page,
to avoid scraping and for privacy. Instead, every portrait carries a small **envelope button
in the top-right corner** which opens a `mailto:` to that person's **role-based club account**.
When the committee changes, the addresses stay correct automatically — nothing to edit.

Only these eight club accounts exist, so only the roles below get a button. Everyone else
has no envelope at all — do **not** invent an address for them.

| Role | Address |
|------|---------|
| President | `jcbc-president@jcsu.jesus.cam.ac.uk` |
| Men's Captain / Men's Vice-Captain | `jcbc-mcaptain@jcsu.jesus.cam.ac.uk` |
| Women's Captain / Women's Vice-Captain | `jcbc-wcaptain@jcsu.jesus.cam.ac.uk` |
| Coxing Captain | `jcbc-cox-captain@jcsu.jesus.cam.ac.uk` |
| All eight Lower Boats Captains | `jcbc-lbcaptains@jcsu.jesus.cam.ac.uk` |
| Fairbairn's Secretary | `jcbc-fbsecretary@jcsu.jesus.cam.ac.uk` |
| Webmaster | `jcbc-webmaster@jcsu.jesus.cam.ac.uk` |
| Coaches / Boatman (facilities) | `boatman@jesus.cam.ac.uk` |

If the club creates a new role account later, add it to the `EMAILS` map in the generator
script, or paste an envelope link into `committee.html` by copying an existing one.
