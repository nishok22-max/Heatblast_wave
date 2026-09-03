# -*- coding: utf-8 -*-
"""The neighbourhood map: 392 H3 zones coloured by UTCI at the peak hour."""
from figs import *

FIELD = "utci_focus"


def hexmap(fname="v_hexmap.png", w=5.8, h=3.35):
    g = load("hexes.geojson")
    feats = g["features"]
    vals = np.array([f["properties"][FIELD] for f in feats])
    lo, hi = vals.min(), vals.max()
    norm = Normalize(lo, hi)

    hottest = max(feats, key=lambda f: f["properties"][FIELD])
    coolest = min(feats, key=lambda f: f["properties"][FIELD])

    fig = plt.figure(figsize=(w, h))
    mw = (h / w) * 1.02                     # map panel takes a square-ish slot
    ax = fig.add_axes([0.0, 0.0, mw, 1.0])
    ax.axis("off")
    ax.set_aspect("equal")

    for f in feats:
        ring = f["geometry"]["coordinates"][0]
        p = f["properties"]
        ec, lw = "#FFFFFF", 0.32
        if p.get("water", 0) > 0.25:
            ec, lw = "#2E86C1", 0.85
        elif p.get("green", 0) > 0.25:
            ec, lw = "#2E7D32", 0.85
        ax.add_patch(MPoly([(pt[0], pt[1]) for pt in ring], closed=True,
                           fc=HEAT(norm(p[FIELD])), ec=ec, lw=lw, zorder=2))

    lons = [pt[0] for f in feats for pt in f["geometry"]["coordinates"][0]]
    lats = [pt[1] for f in feats for pt in f["geometry"]["coordinates"][0]]
    ax.set_xlim(min(lons) - 0.003, max(lons) + 0.003)
    ax.set_ylim(min(lats) - 0.003, max(lats) + 0.003)

    for f, col in ((hottest, "#8E1038"), (coolest, "#1B6CA8")):
        ax.add_patch(MPoly([(pt[0], pt[1]) for pt in f["geometry"]["coordinates"][0]],
                           closed=True, fc="none", ec=col, lw=2.4, zorder=7))

    # ---- side panel -------------------------------------------------------
    sx = mw + 0.035                          # figure-fraction left edge
    fig.text(sx, 0.955, "WHAT THE HEAT FEELS LIKE", fontsize=9.0,
             fontweight="bold", color=SLATE, va="top")
    fig.text(sx, 0.885, "UTCI · 21 May 2010 · 14:30 IST", fontsize=7.8,
             color=MUTED, va="top")

    cax = fig.add_axes([sx, 0.735, 0.955 - sx, 0.042])
    cax.imshow(np.linspace(0, 1, 256).reshape(1, -1), aspect="auto", cmap=HEAT)
    cax.set_xticks([]); cax.set_yticks([])
    for s in cax.spines.values():
        s.set_edgecolor(GRIDC)
    fig.text(sx, 0.700, "safer", fontsize=7.4, color=MUTED, va="top")
    fig.text(0.955, 0.700, "more dangerous", fontsize=7.4, color=MUTED,
             va="top", ha="right")

    cards = ((hottest, "HOTTEST NEIGHBOURHOOD", "#8E1038", 0.415),
             (coolest, "COOLEST NEIGHBOURHOOD", "#1B6CA8", 0.185))
    for f, tag, col, y in cards:
        p = f["properties"]
        name = (p.get("place") or p["h3_index"][:7]).split(" / ")[0].title()
        pan = fig.add_axes([sx, y, 0.955 - sx, 0.205])
        pan.axis("off"); pan.set_xlim(0, 1); pan.set_ylim(0, 1)
        pan.add_patch(FancyBboxPatch((0.012, 0.04), 0.976, 0.92,
                                     boxstyle="round,pad=0,rounding_size=0.09",
                                     fc=col, ec="none"))
        pan.text(0.07, 0.76, tag, fontsize=6.8, fontweight="bold",
                 color="#FFFFFF", alpha=0.85, va="center")
        pan.text(0.07, 0.40, f"{p[FIELD]:.1f} °C", fontsize=15.5,
                 fontweight="bold", color="#FFFFFF", va="center")
        pan.text(0.955, 0.40, name, fontsize=9.4, color="#FFFFFF",
                 va="center", ha="right")

    fig.text(sx, 0.115, "392 zones · H3 res 8 · ~0.74 km² each", fontsize=7.4,
             color=MUTED, va="top")
    key = fig.add_axes([sx, 0.020, 0.955 - sx, 0.062])
    key.axis("off"); key.set_xlim(0, 1); key.set_ylim(0, 1)
    key.text(0.0, 0.5, "outlined:", fontsize=7.4, color=MUTED, va="center")
    for x, col, txt in ((0.20, "#2E86C1", "river / water"),
                        (0.60, "#2E7D32", "parks / green")):
        key.plot([x, x + 0.06], [0.5, 0.5], color=col, lw=2.2)
        key.text(x + 0.085, 0.5, txt, fontsize=7.4, color=MUTED, va="center")
    save(fig, fname)


if __name__ == "__main__":
    hexmap()
