# -*- coding: utf-8 -*-
"""The deck's hero diagrams — plain language, icon-led, minimal prose."""
from figs import *


# ==================================================== slide 2 : the story
def story():
    """Today's warning  →  what a body actually feels  →  what you get."""
    W, H = 12.49, 3.28
    fig, ax = blank(W, H)

    def head(x, w, n, text, col):
        cx = x + 0.16
        ax.add_patch(Circle((cx + 0.08, H - 0.30), 0.115, fc=col, ec="none",
                            zorder=6))
        label(ax, cx + 0.08, H - 0.303, str(n), 8.6, True, "#FFFFFF",
              ha="center")
        label(ax, cx + 0.30, H - 0.30, text, 10.4, True, col)

    # ---------------------------------------------------- 1. today
    x, w = 0.0, 3.40
    rbox(ax, x, 0.0, w, H - 0.56, PANEL, r=0.10)
    head(x, w, 1, "WHAT A WARNING TELLS YOU TODAY", CRIMSON)
    ico(ax, "city", x + 0.72, 1.92, 0.66)
    ico(ax, "thermometer", x + 1.70, 1.95, 0.66)
    label(ax, x + 2.48, 1.95, "46 °C", 26, True, CRIMSON, ha="center")
    label(ax, x + 0.22, 1.06,
          "One number, for the whole city,\none or two days ahead.",
          10.2, True, SLATE, va="center")
    label(ax, x + 0.22, 0.46,
          "It cannot tell dry heat from sticky heat —\n"
          "and those are very different days for a body.",
          8.6, False, MUTED, va="center")

    arrow(ax, 3.56, 1.36, 3.98, 1.36, MAGENTA, 3.0, ms=17)

    # ---------------------------------------------------- 2. what a body feels
    x, w = 4.14, 4.20
    rbox(ax, x, 0.0, w, H - 0.56, SAND, r=0.10)
    head(x, w, 2, "WHAT A BODY ACTUALLY FEELS", EMBER)
    feels = [("sun", "sunshine"), ("droplet", "humidity"),
             ("wind", "wind"), ("thermometer", "air heat")]
    for i, (nm, txt) in enumerate(feels):
        cx = x + 0.62 + i * 0.99
        ico(ax, nm, cx, 2.16, 0.46)
        label(ax, cx, 1.76, txt, 8.6, True, SLATE, ha="center")
        arrow(ax, cx, 1.60, x + 2.10, 1.14, MUTED, 1.3, ms=9)
    ico(ax, "person", x + 2.10, 0.86, 0.54)
    label(ax, x + 0.22, 0.28,
          "Together these decide how much heat a body can shed.",
          9.0, True, SLATE, va="center")

    arrow(ax, 8.50, 1.36, 8.92, 1.36, MAGENTA, 3.0, ms=17)

    # ---------------------------------------------------- 3. what you get
    x, w = 9.08, 3.41
    rbox(ax, x, 0.0, w, H - 0.56, MIST, r=0.10)
    head(x, w, 3, "WHAT YOU GET", STEEL)
    gets = [("map", "Your city, street by street", "not one number"),
            ("clock", "Safe hours, hour by hour", "per kind of worker"),
            ("phone", "A plain warning", "in your own language")]
    for i, (nm, t1, t2) in enumerate(gets):
        cy = 2.12 - i * 0.68
        ico(ax, nm, x + 0.44, cy, 0.44)
        label(ax, x + 0.82, cy + 0.11, t1, 9.8, True, SLATE)
        label(ax, x + 0.82, cy - 0.12, t2, 8.4, False, MUTED)
    save(fig, "d2_story.png")


# =================================================== slide 3 : whole system
def system():
    """What goes in  →  what happens inside  →  what comes out."""
    W, H = 12.49, 4.42
    fig, ax = blank(W, H)

    def band(y, text, col):
        caps(ax, 0.0, y, text, 7.8, col)

    # ------------------------------------------------ inputs
    band(H - 0.13, "WHAT GOES IN — all of it free and public", STEEL)
    ins = [("cloud", "Past and forecast weather",
            "heat, humidity, wind, sunshine — every hour"),
           ("map", "A public map of the city",
            "where the roads, parks and the river are"),
           ("book", "Published safety standards",
            "the limits doctors and safety bodies already use")]
    iw = (W - 2 * 0.24) / 3
    for i, (nm, t1, t2) in enumerate(ins):
        x = i * (iw + 0.24)
        rbox(ax, x, H - 1.10, iw, 0.86, MIST, r=0.09)
        ico(ax, nm, x + 0.40, H - 0.67, 0.40)
        label(ax, x + 0.76, H - 0.55, t1, 9.8, True, SLATE)
        label(ax, x + 0.76, H - 0.80, t2, 8.0, False, MUTED)
        arrow(ax, x + iw / 2, H - 1.16, x + iw / 2, H - 1.40, MAGENTA, 2.2,
              ms=13)

    # ------------------------------------------------ the engine
    band(H - 1.56, "WHAT HAPPENS INSIDE — five steps", CRIMSON)
    steps = [
        ("grid", "Split the city\ninto small zones", "392 zones, ~0.7 km² each"),
        ("fire", "Work out the heat\non a body", "WBGT · UTCI · Heat Index"),
        ("heart", "Turn it into\nsafe minutes outside", "ISO 7243 + ACGIH"),
        ("users", "Rank who is\nmost at risk", "hazard × exposure × people"),
        ("box", "Pack it so anyone\ncan open it", "one offline file + alert"),
    ]
    sw = (W - 4 * 0.20) / 5
    top, sh = H - 1.72, 1.42
    for i, (nm, t1, t2) in enumerate(steps):
        x = i * (sw + 0.20)
        rbox(ax, x, top - sh, sw, sh, "#FFFFFF", ec=GRIDC, lw=1.1, r=0.09)
        hx, hy = x + 0.30, top - 0.30
        ax.add_patch(RegularPolygon((hx, hy), 6, radius=0.185,
                                    orientation=np.pi / 6, fc=INK, ec="none",
                                    zorder=6))
        label(ax, hx, hy - 0.004, str(i + 1), 9.0, True, "#FFFFFF", ha="center")
        ico(ax, nm, x + sw - 0.34, top - 0.30, 0.36)
        label(ax, x + 0.16, top - 0.80, t1, 9.6, True, SLATE, va="center")
        label(ax, x + 0.16, top - 1.24, t2, 7.8, False, MAGENTA, va="center")
        if i < 4:
            arrow(ax, x + sw + 0.03, top - sh / 2, x + sw + 0.17, top - sh / 2,
                  MAGENTA, 2.0, ms=12)
    for i in range(5):
        x = i * (sw + 0.20)
        arrow(ax, x + sw / 2, top - sh - 0.05, x + sw / 2, top - sh - 0.27,
              MAGENTA, 1.6, ms=10)

    # ------------------------------------------------ outputs
    oy = top - sh - 0.68
    band(oy + 0.30, "WHAT COMES OUT — one file you can open anywhere", GREEN)
    outs = [("desktop", "A map you can scrub\nthrough the day"),
            ("bullhorn", "A warning in English,\nHindi and Gujarati"),
            ("clock", "When to stop work,\nand when to restart")]
    ow = 2.44
    for i, (nm, t) in enumerate(outs):
        x = i * (ow + 0.16)
        rbox(ax, x, 0.0, ow, oy + 0.16, SAND, r=0.09)
        ico(ax, nm, x + 0.36, (oy + 0.16) / 2, 0.38)
        label(ax, x + 0.70, (oy + 0.16) / 2, t, 9.2, True, SLATE, va="center")
    px = 3 * (ow + 0.16)
    photo(fig, os.path.join(OUT, "v_proto.png"), px, 0.0, W - px, oy + 0.16,
          W, H)
    save(fig, "d3_system.png")


# ================================================ slide 4 : the decision gate
def gate():
    """A yes/no flowchart: did we prove this was worth building?"""
    W, H = 6.12, 5.28
    fig, ax = blank(W, H)
    cx = 3.06

    def node(y, h, text, col, bg, icon=None, size=10.0):
        rbox(ax, 0.24, y, 5.64, h, bg, ec=col, lw=1.3, r=0.10)
        tx = 0.46
        if icon:
            ico(ax, icon, 0.66, y + h / 2, 0.36)
            tx = 1.00
        label(ax, tx, y + h / 2, text, size, True, col, va="center")

    node(4.44, 0.70, "Does one city-wide number\nhide street-level danger?",
         STEEL, MIST, "question")
    arrow(ax, cx, 4.40, cx, 4.10, MAGENTA, 2.4, ms=14)

    node(3.38, 0.68, "Measure it — 392 zones,\none single moment",
         INK, PANEL, "gauge")
    arrow(ax, cx, 3.34, cx, 3.10, MAGENTA, 2.4, ms=14)

    # the gate itself — tall enough that three lines clear the sloped edges
    ax.add_patch(MPoly([(cx, 3.06), (cx + 1.60, 2.52), (cx, 1.98),
                        (cx - 1.60, 2.52)], closed=True, fc="#FFFFFF",
                       ec=CRIMSON, lw=1.6, zorder=3))
    label(ax, cx, 2.74, "Gap between the hottest", 8.6, False, SLATE,
          ha="center")
    label(ax, cx, 2.56, "and coolest zone", 8.6, False, SLATE, ha="center")
    label(ax, cx, 2.34, "≥ 3 °C ?", 10.6, True, CRIMSON, ha="center")

    # NO branch
    arrow(ax, cx - 1.64, 2.52, 0.86, 2.52, MUTED, 1.8, ms=12)
    ico(ax, "xmark", 0.56, 2.52, 0.26, alpha=0.55)
    label(ax, 0.24, 2.10, "no → drop the map,\nbuild something else", 7.8,
          False, MUTED, va="center")

    # YES branch
    arrow(ax, cx, 1.94, cx, 1.66, GREEN, 2.6, ms=15)
    label(ax, cx + 0.12, 1.83, "YES — it was 3.88 °C", 9.2, True, GREEN)

    rbox(ax, 0.24, 0.96, 5.64, 0.66, "#E6F2EC", ec=GREEN, lw=1.4, r=0.10)
    ico(ax, "check", 0.66, 1.29, 0.32)
    label(ax, 1.00, 1.29, "PROCEED — where you stand\nchanges how dangerous it is",
          10.0, True, GREEN, va="center")
    arrow(ax, cx, 0.92, cx, 0.70, MAGENTA, 2.2, ms=13)

    # stress test strip
    rbox(ax, 0.24, 0.0, 5.64, 0.66, PANEL, ec=GRIDC, lw=1.0, r=0.10)
    ico(ax, "flask", 0.60, 0.33, 0.30)
    label(ax, 0.90, 0.46, "Stress-tested against our one guess", 8.8, True,
          SLATE)
    label(ax, 0.90, 0.22, "every published value still clears the bar", 7.8,
          False, MUTED)
    bars = [2.57, 3.88, 5.20, 6.53]
    bx0, bw, unit = 4.12, 0.34, 0.045
    ax.plot([bx0 - 0.08, bx0 + 4 * bw + 0.06], [0.12 + 3.0 * unit] * 2,
            color=GREEN, lw=1.2, ls=(0, (3, 2)), zorder=7)
    for i, v in enumerate(bars):
        rbox(ax, bx0 + i * bw, 0.12, bw - 0.09, v * unit,
             CRIMSON if i == 1 else AMBER, r=0.02, z=6)
    save(fig, "d4_gate.png")


# ================================================ slide 4 : risks -> fixes
def risks():
    """Four honest gaps, each with what we did about it."""
    W, H = 6.03, 5.28
    fig, ax = blank(W, H)
    rows = [
        ("We guessed how much hotter\na dense street runs",
         "Tested the whole published\nrange — the answer holds"),
        ("No street-level data on\nwho lives where",
         "Shown as a gap, not hidden;\nthe slot for it is built"),
        ("Health effects not tuned to\nthis city's records",
         "Labelled uncalibrated; needs\nhospital data access"),
        ("Hindi and Gujarati text is\nmachine-written",
         "Locked until a speaker checks;\nalerts marked practice-only"),
    ]
    caps(ax, 0.0, 5.10, "KNOWN GAP", 7.6, "#9A3A12")
    caps(ax, 3.31, 5.10, "WHAT WE DID ABOUT IT", 7.6, "#1E6047")

    rh, gap, base = 0.94, 0.10, 0.80
    for i, (risk, fix) in enumerate(rows):
        y = base + (3 - i) * (rh + gap)
        cy = y + rh / 2
        rbox(ax, 0.0, y, 2.72, rh, "#FDECE4", ec="#F0C7B2", lw=1.0, r=0.09)
        ico(ax, "warning", 0.36, cy, 0.34)
        label(ax, 0.64, cy, risk, 9.4, True, "#9A3A12", va="center")

        arrow(ax, 2.80, cy, 3.24, cy, MAGENTA, 2.4, ms=14)

        rbox(ax, 3.31, y, 2.72, rh, "#E6F2EC", ec="#B7D8C7", lw=1.0, r=0.09)
        ico(ax, "shield", 3.67, cy, 0.34)
        label(ax, 3.95, cy, fix, 9.4, True, "#1E6047", va="center")

    rbox(ax, 0.0, 0.0, W, 0.62, PANEL, ec=GRIDC, lw=1.0, r=0.09)
    ico(ax, "eye", 0.36, 0.31, 0.32)
    label(ax, 0.66, 0.40, "Nothing here is hidden", 9.6, True, INK)
    label(ax, 0.66, 0.17,
          "all seven data layers ship with a status label on the face of the tool",
          8.2, False, MUTED)
    save(fig, "d4_risks.png")


# ============================================== slide 5 : one warning, 5 people
def people():
    """One computed hour  →  five readers  →  five things that change."""
    W, H = 7.70, 2.72
    fig, ax = blank(W, H)

    rbox(ax, 4.86, 0.0, W - 4.86, H, MIST, r=0.09)
    caps(ax, 4.98, H - 0.14, "WHAT CHANGES", 7.0, STEEL)
    caps(ax, 1.96, H - 0.14, "WHO READS IT", 7.0, CRIMSON)

    rbox(ax, 0.0, 0.58, 1.48, 1.42, INK, r=0.10)
    ico(ax, "bolt", 0.74, 1.66, 0.34)
    label(ax, 0.74, 1.22, "One hour,\none zone,\nworked out", 9.4, True,
          "#FFFFFF", ha="center", va="center")
    label(ax, 0.74, 0.36, "read five ways", 8.0, True, MUTED, ha="center")

    rows = [
        ("building", "City commissioner", "which areas first — 5 days ahead",
         "truck", "water and shade sent\nwhere it is worst"),
        ("stethoscope", "Health officer", "when the peak lands",
         "hospital", "relief in place\nbefore the peak"),
        ("helmet", "Labour department", "safe minutes, hour by hour",
         "clock", "shifts moved, not\nwork simply lost"),
        ("house", "Field health worker", "who to check on first — offline",
         "heart", "the frailest reached\nfirst, not last"),
        ("person", "Outdoor worker", "when to stop, in their language",
         "shield", "a warning they can\nactually act on"),
    ]
    rh = (H - 0.22) / 5
    for i, (nm, who, what, onm, out) in enumerate(rows):
        y = H - 0.22 - (i + 1) * rh + rh / 2
        arrow(ax, 1.54, 1.29, 1.92, y, MAGENTA, 1.4, ms=9)
        ico(ax, nm, 2.12, y, 0.32)
        label(ax, 2.36, y + 0.10, who, 9.4, True, SLATE)
        label(ax, 2.36, y - 0.11, what, 8.2, False, MUTED)
        arrow(ax, 4.50, y, 4.78, y, MAGENTA, 1.6, ms=10)
        ico(ax, onm, 5.16, y, 0.30)
        label(ax, 5.40, y, out, 8.4, True, "#1B4F72", va="center", ls=1.2)
    save(fig, "d5_people.png")


if __name__ == "__main__":
    story()
    system()
    gate()
    risks()
    people()
