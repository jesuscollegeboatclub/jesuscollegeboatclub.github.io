#!/usr/bin/env python3
"""Redraw the three Fairbairns coxes'-notes maps as clean SVGs.
River geometry = centrelines traced from the original PDF images (center.json).
All annotation coordinates below are in the ORIGINAL image's pixel space."""
import json, math, os  # run: python3 docs/fairbairn-maps/make_maps.py

C = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "river-centrelines.json")))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "images", "fairbairns")
os.makedirs(OUT, exist_ok=True)

INK, SOFT, CRIM, NAVY, ORNG = "#171411", "#5B544D", "#8A1218", "#1E3A5F", "#D9731A"
LAND, LINE, WATER, BANK = "#F6F3EE", "#E2DDD4", "#BCDDF5", "#86B8E3"
FONT = "Archivo, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"
PAD, TOP = 28, 100

def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

class Map:
    def __init__(self, key, s, wdraw, title, sub):
        d = C[key]; self.s = s; self.w = d["w"] * s; self.h = d["h"] * s
        self.W = self.w + 2 * PAD; self.title, self.sub = title, sub
        pts = [p for seg in d["segs"] for p in seg]            # index increases = upstream
        P = [self.T(p) for p in pts]
        def ext(a, b, L=70):
            dx, dy = a[0]-b[0], a[1]-b[1]; n = math.hypot(dx, dy) or 1
            return (a[0]+dx/n*L, a[1]+dy/n*L)
        self.P = [ext(P[0], P[4])] + P + [ext(P[-1], P[-5])]
        self.rw = wdraw                                        # drawn river width (final px)
        self.cum = [0.0]
        for a, b in zip(self.P, self.P[1:]): self.cum.append(self.cum[-1] + math.dist(a, b))
        self.el = []; self.labels = []; self.markers = []
    def T(self, p): return (p[0] * self.s + PAD, p[1] * self.s + TOP)
    # --- geometry helpers -------------------------------------------------
    def near(self, q):  # q already transformed
        i = min(range(len(self.P)), key=lambda k: math.dist(self.P[k], q)); return i
    def frame(self, i):
        a = self.P[max(i - 3, 0)]; b = self.P[min(i + 3, len(self.P) - 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]; L = math.hypot(tx, ty) or 1
        t = (tx / L, ty / L); n = (-t[1], t[0]); return self.P[i], t, n
    def side(self, q):  # signed side (+1/-1) of transformed point q
        i = self.near(q); p, t, n = self.frame(i)
        return 1 if (q[0] - p[0]) * n[0] + (q[1] - p[1]) * n[1] > 0 else -1
    def at_s(self, sval):
        sval = max(0, min(sval, self.cum[-1]))
        i = max(k for k in range(len(self.cum)) if self.cum[k] <= sval) if sval > 0 else 0
        return i
    def dist_river(self, q): return min(math.dist(p, q) for p in self.P[::2])
    # --- drawing primitives ------------------------------------------------
    def river(self):
        P = self.P; d = f"M{P[0][0]:.1f},{P[0][1]:.1f}"
        for i in range(len(P) - 1):
            p0 = P[max(i - 1, 0)]; p1 = P[i]; p2 = P[i + 1]; p3 = P[min(i + 2, len(P) - 1)]
            c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
            c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
            d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
        return (f'<path d="{d}" fill="none" stroke="{BANK}" stroke-width="{self.rw+3}" stroke-linecap="round" stroke-linejoin="round"/>'
                f'<path d="{d}" fill="none" stroke="{WATER}" stroke-width="{self.rw}" stroke-linecap="round" stroke-linejoin="round"/>')
    def across(self, oq, color, width=4, ext=10, dash=None, double=False):
        q = self.T(oq); i = self.near(q); p, t, n = self.frame(i); h = self.rw / 2 + ext
        offs = [-3.5, 3.5] if double else [0]
        da = f' stroke-dasharray="{dash}"' if dash else ""
        for o in offs:
            a = (p[0] + n[0] * h + t[0] * o, p[1] + n[1] * h + t[1] * o)
            b = (p[0] - n[0] * h + t[0] * o, p[1] - n[1] * h + t[1] * o)
            self.el.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{color}" stroke-width="{width}" stroke-linecap="round"{da}/>')
        return p
    def arrow(self, p, dirv, color, L=24, w=2.6):
        a = (p[0] - dirv[0] * L / 2, p[1] - dirv[1] * L / 2); b = (p[0] + dirv[0] * L / 2, p[1] + dirv[1] * L / 2)
        hx, hy = dirv; nx, ny = -hy, hx; hl, hw = 8, 5
        tip = b; base = (b[0] - hx * hl, b[1] - hy * hl)
        self.el.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{base[0]:.1f}" y2="{base[1]:.1f}" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>'
                       f'<path d="M{tip[0]:.1f},{tip[1]:.1f} L{base[0]+nx*hw:.1f},{base[1]+ny*hw:.1f} L{base[0]-nx*hw:.1f},{base[1]-ny*hw:.1f} Z" fill="{color}"/>')
    def lane_arrows(self, oq_from, oq_to, side, upstream, color, every=95, avoid=()):
        i0 = self.near(self.T(oq_from)); i1 = self.near(self.T(oq_to))
        s0, s1 = sorted((self.cum[i0], self.cum[i1])); off = self.rw * 0.24
        av = [self.cum[self.near(self.T(a))] for a in avoid]
        sv = s0 + every / 2
        while sv < s1:
            if all(abs(sv - x) > 26 for x in av):
                i = self.at_s(sv); p, t, n = self.frame(i)
                d = t if upstream else (-t[0], -t[1])
                self.arrow((p[0] + n[0] * off * side, p[1] + n[1] * off * side), d, color)
            sv += every
    def loop(self, oq, from_side, toward_upstream, color, depth=34, dashed=False):
        q = self.T(oq); i = self.near(q); s0 = self.cum[i]
        s1 = s0 + depth if toward_upstream else s0 - depth
        p0, t0, n0 = self.frame(i); p1, t1, n1 = self.frame(self.at_s(s1)); off = self.rw * 0.26
        A = (p0[0] + n0[0] * off * from_side, p0[1] + n0[1] * off * from_side)
        B = (p0[0] - n0[0] * off * from_side, p0[1] - n0[1] * off * from_side)
        A2 = (p1[0] + n1[0] * off * 1.9 * from_side, p1[1] + n1[1] * off * 1.9 * from_side)
        B2 = (p1[0] - n1[0] * off * 1.9 * from_side, p1[1] - n1[1] * off * 1.9 * from_side)
        da = ' stroke-dasharray="5 4"' if dashed else ""
        self.el.append(f'<path d="M{A[0]:.1f},{A[1]:.1f} C{A2[0]:.1f},{A2[1]:.1f} {B2[0]:.1f},{B2[1]:.1f} {B[0]:.1f},{B[1]:.1f}" fill="none" stroke="{color}" stroke-width="2.6" stroke-linecap="round"{da}/>')
        dx, dy = B[0] - B2[0], B[1] - B2[1]; L = math.hypot(dx, dy) or 1; d = (dx / L, dy / L)
        nx, ny = -d[1], d[0]; base = (B[0] - d[0] * 8, B[1] - d[1] * 8)
        self.el.append(f'<path d="M{B[0]+d[0]*2:.1f},{B[1]+d[1]*2:.1f} L{base[0]+nx*5:.1f},{base[1]+ny*5:.1f} L{base[0]-nx*5:.1f},{base[1]-ny*5:.1f} Z" fill="{color}"/>')
    def marker(self, oq, num, r=12.5):
        q = self.T(oq); i = self.near(q); p, t, n = self.frame(i); sd = self.side(q)
        dist = self.rw / 2 + r + 3
        self.markers.append([p[0] + n[0] * dist * sd, p[1] + n[1] * dist * sd, num, n, sd, r])
    def building(self, oq, w, h, rot=0, fill="#D3CDC4", stroke="#8C857C"):
        x, y = self.T(oq); a = math.radians(rot); ca, sa = math.cos(a), math.sin(a)
        pts = [(x + ca*dx - sa*dy, y + sa*dx + ca*dy) for dx, dy in ((-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2))]
        self.el.append('<polygon points="' + " ".join(f"{px:.1f},{py:.1f}" for px, py in pts) + f'" fill="{fill}" stroke="{stroke}" stroke-width="1.2" stroke-linejoin="round"/>')
    def label(self, oq, text, size=14, color=INK, weight=600, anchor="middle", italic=False, push=True, lh=None):
        lines = text.split("\n"); x, y = self.T(oq); lh = lh or size * 1.22
        self.labels.append([x, y, lines, size, color, weight, anchor, italic, push, lh])
    def leader(self, oa, ob, color=SOFT):
        a, b = self.T(oa), self.T(ob)
        self.el.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{color}" stroke-width="1.3"/>')
    # --- finishing --------------------------------------------------------
    def _relax_markers(self):
        M = self.markers
        for _ in range(60):
            moved = False
            for a in range(len(M)):
                for b in range(a + 1, len(M)):
                    A, B = M[a], M[b]
                    if math.dist(A[:2], B[:2]) < A[5] + B[5] + 3:
                        lo = B if B[2] > A[2] else A   # push higher start number outward
                        lo[0] += lo[3][0] * lo[4] * 3; lo[1] += lo[3][1] * lo[4] * 3; moved = True
            if not moved: break
    def _place_labels(self):
        out = []
        for x, y, lines, size, color, weight, anchor, italic, push, lh in self.labels:
            wbox = max(len(l) for l in lines) * size * 0.56; hbox = lh * len(lines)
            def box(x, y):
                x0 = x - wbox / 2 if anchor == "middle" else (x - wbox if anchor == "end" else x)
                return x0, y - size * 0.9, wbox, hbox
            def hit(x, y):
                x0, y0, w, h = box(x, y)
                pts = [(x0 + w * fx, y0 + h * fy) for fx in (0, .25, .5, .75, 1) for fy in (0, .5, 1)]
                return any(self.dist_river(p) < self.rw / 2 + 7 for p in pts)
            if push:
                for _ in range(40):
                    if not hit(x, y): break
                    x0, y0, w, h = box(x, y); c = (x0 + w / 2, y0 + h / 2)
                    i = self.near(c); p, t, n = self.frame(i)
                    sd = 1 if (c[0] - p[0]) * n[0] + (c[1] - p[1]) * n[1] > 0 else -1
                    x += n[0] * sd * 4; y += n[1] * sd * 4
            st = ' font-style="italic"' if italic else ""
            for k, l in enumerate(lines):
                yy = y + k * lh
                common = f'x="{x:.1f}" y="{yy:.1f}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}"{st}'
                out.append(f'<text {common} fill="none" stroke="{LAND}" stroke-width="5" stroke-linejoin="round">{esc(l)}</text>')
                out.append(f'<text {common} fill="{color}">{esc(l)}</text>')
        return out
    def legend(self, items):
        x0 = PAD; y = TOP + self.h + 34; x = x0; maxw = self.W - 2 * PAD; out = []; row_h = 30
        for kind, text in items:
            iw = 40; tw = len(text) * 13.5 * 0.53; wtot = iw + tw + 26
            if x + wtot > x0 + maxw and x > x0: x = x0; y += row_h
            cy = y - 5
            if kind == "marker":
                out.append(f'<circle cx="{x+14}" cy="{cy}" r="11" fill="{CRIM}" stroke="#fff" stroke-width="2"/><text x="{x+14}" y="{cy+4}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">10</text>')
            elif kind in ("navy", "orange"):
                c = NAVY if kind == "navy" else ORNG
                out.append(f'<line x1="{x}" y1="{cy}" x2="{x+22}" y2="{cy}" stroke="{c}" stroke-width="2.6" stroke-linecap="round"/><path d="M{x+30},{cy} L{x+21},{cy-5} L{x+21},{cy+5} Z" fill="{c}"/>')
            elif kind == "spin":
                out.append(f'<path d="M{x+2},{cy-6} C{x+30},{cy-12} {x+30},{cy+12} {x+6},{cy+6}" fill="none" stroke="{ORNG}" stroke-width="2.6" stroke-dasharray="5 4" stroke-linecap="round"/><path d="M{x+2},{cy+6} L{x+10},{cy+1} L{x+10},{cy+11} Z" fill="{ORNG}"/>')
            elif kind == "uturn":
                out.append(f'<path d="M{x+2},{cy-6} C{x+30},{cy-12} {x+30},{cy+12} {x+6},{cy+6}" fill="none" stroke="{NAVY}" stroke-width="2.6" stroke-linecap="round"/><path d="M{x+2},{cy+6} L{x+10},{cy+1} L{x+10},{cy+11} Z" fill="{NAVY}"/>')
            elif kind == "finish":
                out.append(f'<line x1="{x}" y1="{cy}" x2="{x+30}" y2="{cy}" stroke="{CRIM}" stroke-width="4" stroke-dasharray="6 4" stroke-linecap="round"/>')
            elif kind == "timing":
                out.append(f'<line x1="{x}" y1="{cy}" x2="{x+30}" y2="{cy}" stroke="{CRIM}" stroke-width="4" stroke-linecap="round"/>')
            elif kind == "rolling":
                out.append(f'<line x1="{x}" y1="{cy}" x2="{x+30}" y2="{cy}" stroke="{NAVY}" stroke-width="3" stroke-dasharray="5 4" stroke-linecap="round"/>')
            elif kind == "bridge":
                out.append(f'<line x1="{x}" y1="{cy-3.5}" x2="{x+30}" y2="{cy-3.5}" stroke="{INK}" stroke-width="3.5"/><line x1="{x}" y1="{cy+3.5}" x2="{x+30}" y2="{cy+3.5}" stroke="{INK}" stroke-width="3.5"/>')
            out.append(f'<text x="{x+iw}" y="{y}" font-size="13.5" fill="{INK}">{esc(text)}</text>')
            x += wtot
        self.H = y + 30
        return out
    def svg(self, legend_items, fname):
        self._relax_markers()
        mk = []
        for x, y, num, n, sd, r in self.markers:
            fs = 12 if num < 10 else 11
            mk.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{CRIM}" stroke="#fff" stroke-width="2"/>'
                      f'<text x="{x:.1f}" y="{y+4:.1f}" font-size="{fs}" font-weight="700" fill="#fff" text-anchor="middle" stroke="none">{num}</text>')
        labels = self._place_labels(); leg = self.legend(legend_items)
        fx, fy = PAD, TOP
        body = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.W:.0f} {self.H:.0f}" width="{self.W:.0f}" height="{self.H:.0f}" font-family="{FONT}" role="img" aria-label="{esc(self.title)}">\n'
                f'<title>{esc(self.title)}</title>\n'
                f'<rect width="100%" height="100%" fill="#fff"/>\n'
                f'<rect x="{fx}" y="{fy}" width="{self.w:.1f}" height="{self.h:.1f}" rx="14" fill="{LAND}"/>\n'
                f'{self.river()}\n' + "\n".join(self.el) + "\n"
                + f'<path d="M0,0 H{self.W:.0f} V{self.H:.0f} H0 Z M{fx+14},{fy} H{fx+self.w-14:.1f} Q{fx+self.w:.1f},{fy} {fx+self.w:.1f},{fy+14} V{fy+self.h-14:.1f} Q{fx+self.w:.1f},{fy+self.h:.1f} {fx+self.w-14:.1f},{fy+self.h:.1f} H{fx+14} Q{fx},{fy+self.h:.1f} {fx},{fy+self.h-14:.1f} V{fy+14} Q{fx},{fy} {fx+14},{fy} Z" fill="#fff" fill-rule="evenodd"/>\n'
                + f'<rect x="{fx}" y="{fy}" width="{self.w:.1f}" height="{self.h:.1f}" rx="14" fill="none" stroke="{LINE}" stroke-width="1.5"/>\n'
                + f'<text x="{PAD}" y="30" font-size="11.5" font-weight="700" letter-spacing="1.6" fill="{CRIM}">FAIRBAIRN CUP · COXES’ NOTES</text>\n'
                + f'<text x="{PAD}" y="58" font-size="23" font-weight="800" fill="{INK}">{esc(self.title)}</text>\n'
                + f'<text x="{PAD}" y="82" font-size="14" fill="{SOFT}">{esc(self.sub)}</text>\n'
                + "\n".join(mk) + "\n" + "\n".join(labels) + "\n"
                + "\n".join(leg) + "\n</svg>\n")
        open(os.path.join(OUT, fname), "w").write(body)
        print("wrote", fname, f"{self.W:.0f}x{self.H:.0f}")

# ======================= MAP 1: START MARSHALLING ==========================
m = Map("m1", 1.0, 32, "Start marshalling & circulation",
        "Jesus Lock to Jesus College Boathouse · waiting positions shown by start number")
S_SOUTH = m.side(m.T((821, 279)))   # Fort St George side (crew 1)
S_NORTH = -S_SOUTH                  # boathouse side
m.across((210, 118), "#2E6B3F", width=5, ext=9)                      # Jesus Lock
m.across((555, 62), INK, width=3.5, ext=9, double=True)              # Victoria Ave road bridge
m.across((733, 160), "#7A4A2A", width=3.5, ext=9, double=True)       # Fort St George footbridge
m.across((884, 330), NAVY, width=3, ext=14, dash="5 4")              # rolling start
m.across((938, 347), CRIM, width=4, ext=14)                          # timing starts
m.loop((292, 92), S_NORTH, True, NAVY, depth=46)                     # spin at Jesus Lock
m.lane_arrows((300, 85), (866, 322), S_SOUTH, False, NAVY, every=98, avoid=[(555, 62), (733, 160)])
m.lane_arrows((330, 75), (790, 215), S_NORTH, True, NAVY, every=98, avoid=[(555, 62), (733, 160)])
for xy, num in [((821, 279), 1), ((759, 201), 5), ((661, 124), 10), ((576, 87), 15), ((460, 67), 20), ((338, 95), 25),
                ((355, 50), 30), ((477, 37), 35), ((581, 57), 40), ((693, 111), 45)]:
    m.marker(xy, num)
m.building((622, 50), 28, 20, -20); m.building((723, 118), 20, 15, 25); m.building((697, 162), 20, 14, 30)
m.building((833, 229), 26, 28, 25); m.building((900, 300), 20, 16, 25)
m.building((941, 314), 26, 22, 25, fill=CRIM, stroke="#5E0B10")
m.label((150, 126), "Jesus Lock")
m.label((566, 18), "Victoria Avenue\nRoad Bridge", size=13.5)
m.label((642, 46), "Queens’ / Magdalene", size=12.5, weight=500, anchor="start", push=False)
m.label((736, 110), "Peterhouse", size=12.5, weight=500, anchor="start", push=False)
m.label((772, 132), "Fort St George\nFootbridge", size=13.5, anchor="start")
m.label((683, 186), "Fort St George", size=12.5, weight=500, anchor="end", push=False)
m.label((852, 234), "CRA / 99s", size=12.5, weight=500, anchor="start", push=False)
m.label((884, 296), "Goldie", size=12.5, weight=500, anchor="end", push=False)
m.label((960, 246), "Jesus College\nBoathouse", size=14, color=CRIM, weight=800)
m.leader((960, 274), (946, 300), CRIM)
m.label((872, 374), "Rolling start", size=13, color=NAVY, weight=700, anchor="end")
m.label((968, 320), "Timing starts (JCBC flagpole)", size=13, color=CRIM, weight=700, anchor="start")
m.label((205, 44), "Boathouse side · crews point upstream", size=13, color=SOFT, weight=500, italic=True)
m.label((470, 160), "Fort St George side · crews point downstream", size=13, color=SOFT, weight=500, italic=True)
m.label((1140, 424), "Downstream to the course →", size=12.5, color=SOFT, weight=500, italic=True, anchor="end")
m.svg([("marker", "Waiting position (start number)"), ("navy", "Circulation direction"),
       ("uturn", "Spin at Jesus Lock"), ("rolling", "Rolling start"), ("timing", "Timing starts"),
       ("bridge", "Bridge")], "start-marshalling.svg")

# ======================= MAP 2: PLOUGH REACH / NOVICE FINISH ===============
m = Map("m2", 0.62, 26, "Finish: Long Reach to Grassy Corner",
        "Novice VIII finish at the Railings · crews finishing here spin beyond Grassy Corner")
S_RACE = m.side(m.T((1127, 732)))   # racing lane (from original racing arrow)
S_BACK = -S_RACE
m.across((255, 858), INK, width=5, ext=10)                                   # railway bridge
m.across((1020, 742), CRIM, width=4.5, ext=16, dash="7 5")                   # novice finish
m.loop((1440, 222), S_RACE, False, ORNG, depth=40, dashed=True)              # spin zone
m.lane_arrows((420, 840), (1415, 300), S_RACE, False, NAVY, every=150, avoid=[(1020, 742)])
m.lane_arrows((1110, 690), (1400, 270), S_BACK, True, ORNG, every=150)
for xy, num in [((1137, 680), 1), ((1329, 647), 10), ((1482, 571), 20), ((1448, 446), 30), ((1382, 283), 40)]:
    m.marker(xy, num)
m.label((280, 800), "Railway Bridge")
m.label((905, 590), "Novice VIII finish\nat the Railings", size=14.5, color=CRIM, weight=800)
m.label((1622, 690), "Ditton Corner", size=14.5, color=NAVY, weight=800)
m.label((1378, 226), "Grassy Corner", size=14.5, color=NAVY, weight=800, anchor="end")
m.label((1700, 60), "First Post Corner", size=14.5, color=NAVY, weight=800, anchor="end")
m.label((1740, 430), "The Plough", size=14, weight=700)
m.label((1482, 252), "Spin zone", size=14, color=ORNG, weight=800, anchor="start")
m.label((640, 772), "Long Reach", size=13, color=SOFT, weight=500, italic=True)
m.label((1330, 430), "Plough Reach", size=13, color=SOFT, weight=500, italic=True, anchor="end")
m.label((1690, 175), "First Post Reach", size=13, color=SOFT, weight=500, italic=True)
m.label((30, 690), "← Upstream: from the start", size=12.5, color=SOFT, weight=500, italic=True, anchor="start")
m.svg([("marker", "Pull-in position (start number), as directed by marshals"),
       ("navy", "Racing direction: keep rowing past the finish"), ("spin", "Spin zone"),
       ("orange", "After spinning, row back upstream"), ("finish", "Finish line")], "finish-long-reach.svg")

# ======================= MAP 3: LITTLE BRIDGE / SENIOR VIII FINISH =========
m = Map("m3", 0.8, 28, "Finish: Little Bridge",
        "Senior VIII finish · spin just before Baits Bite Lock")
S_BANK = m.side(m.T((40, 514)))     # bank where crews 1-20 pull in
S_RACE = -S_BANK
m.across((45, 784), INK, width=3.5, ext=10, double=True)                     # A14 bridge
m.across((52, 595), CRIM, width=4.5, ext=16, dash="7 5")                     # senior finish
m.across((402, 157), "#8C857C", width=6, ext=12)                              # Baits Bite lock gate
m.loop((360, 182), S_RACE, False, ORNG, depth=26, dashed=True)               # spin zone
m.lane_arrows((60, 610), (345, 195), S_RACE, False, NAVY, every=120)
m.lane_arrows((70, 560), (335, 200), S_BANK, True, ORNG, every=120)
for xy, num in [((40, 514), 1), ((62, 518), 21), ((151, 426), 45), ((162, 323), 10), ((186, 331), 30),
                ((303, 251), 40), ((323, 148), 20)]:
    m.marker(xy, num)
m.building((366, 80), 34, 28, 20)
m.label((338, 34), "Baits Bite Lock", size=14, weight=700)
m.label((398, 234), "Spin zone", size=14, color=ORNG, weight=800, anchor="start")
m.label((205, 618), "Senior VIII finish\nat Little Bridge", size=14.5, color=CRIM, weight=800)
m.label((180, 795), "A14 motorway\nbridge", size=13.5)
m.label((130, 905), "↓ Upstream: from First Post Corner", size=12, color=SOFT, weight=500, italic=True, anchor="start")
m.svg([("marker", "Pull-in position (start number)"), ("navy", "Racing direction"),
       ("spin", "Spin zone"), ("orange", "After spinning, row back upstream"), ("finish", "Finish line")],
      "finish-little-bridge.svg")
