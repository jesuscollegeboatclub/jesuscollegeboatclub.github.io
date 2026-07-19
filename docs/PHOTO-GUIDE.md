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

Anyone without a photo yet shows a **claret tile with their initials** and the words
"PHOTO TO FOLLOW". Currently five people:

| File | Waiting on |
|------|-----------|
| `vicecaptainmen.jpg` | Finn Foley |
| `vicecaptainwomen.jpg` | Ingrid Berg |
| `webmaster.jpg` | Grace Skinner |
| `welfareofficer2.jpg` | Marleen Wölke |
| `stashofficer1.jpg` | Will Galloway |

Drop a square photo in under the matching filename and the placeholder disappears
automatically — no code changes needed.

## A note on email addresses

Personal `@cam.ac.uk` addresses are deliberately **not** published on the committee page,
to avoid scraping and for privacy. Instead, every portrait carries a small **envelope button
in the top-right corner** which opens a `mailto:` to that person's **role-based club account**.
When the committee changes, the addresses stay correct automatically — nothing to edit.

| Role | Address |
|------|---------|
| President | `jcbc-president@jcsu.jesus.cam.ac.uk` |
| Men's Captain / Men's Vice-Captain | `jcbc-mcaptain@jcsu.jesus.cam.ac.uk` |
| Women's Captain / Women's Vice-Captain | `jcbc-wcaptain@jcsu.jesus.cam.ac.uk` |
| Coxing Captain | `jcbc-cox-captain@jcsu.jesus.cam.ac.uk` |
| All eight Lower Boats Captains | `jcbc-lbcaptains@jcsu.jesus.cam.ac.uk` |
| Treasurer | `jcbc-treasurer@jcsu.jesus.cam.ac.uk` |
| Secretary | `jcbc-secretary@jcsu.jesus.cam.ac.uk` |
| Fairbairn's Secretary | `jcbc-fbsecretary@jcsu.jesus.cam.ac.uk` |
| Webmaster | `jcbc-webmaster@jcsu.jesus.cam.ac.uk` |
| Social Secretaries | `jcbc-social@jcsu.jesus.cam.ac.uk` |
| Welfare Officers | `jcbc-welfare@jcsu.jesus.cam.ac.uk` |
| Fundraising / Sponsorship Officer | `jcbc-sponsorship@jcsu.jesus.cam.ac.uk` |
| Alumni & Outreach Officer | `jcbc-alumni@jcsu.jesus.cam.ac.uk` |
| Stash Officers | `jcbc-stash@jcsu.jesus.cam.ac.uk` |
| Coaches / Boatman | `boatman@jesus.cam.ac.uk` |

**Please check the italicised ones below actually exist before going live** — they follow the
same `jcbc-<role>@jcsu…` pattern as the confirmed addresses, but were inferred rather than taken
from an official list: *treasurer, secretary, social, welfare, alumni, stash*. To correct one,
edit the address in `committee.html` (search for `mailto:`).
