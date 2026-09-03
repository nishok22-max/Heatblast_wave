# -*- coding: utf-8 -*-
"""Figures for the case study. Every number here is from a cited source;
nothing is estimated or smoothed for effect."""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")

INK, SLATE, MUTED = "#241043", "#3A3F52", "#7A7F91"
CRIMSON, EMBER, AMBER = "#8E1038", "#D2541F", "#F5A03C"
STEEL, GREEN, GRID = "#1B6CA8", "#2E7D5B", "#E3DFEC"

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.sans-serif": ["Calibri", "Arial", "DejaVu Sans"],
    "text.color": SLATE, "axes.labelcolor": SLATE,
    "xtick.color": MUTED, "ytick.color": MUTED, "axes.edgecolor": GRID,
})


def rbox(ax, x, y, w, h, fc, ec="none", lw=0, r=0.02, z=2):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
                                boxstyle=f"round,pad=0,rounding_size={r}",
                                fc=fc, ec=ec, lw=lw, zorder=z, mutation_aspect=1))


def blank(w, h):
    fig = plt.figure(figsize=(w, h))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, w); ax.set_ylim(0, h); ax.axis("off")
    return fig, ax


def undercount():
    """What is counted, against what is modelled. Same country, same heat."""
    W, H = 8.6, 4.05
    fig, ax = blank(W, H)
    rows = [
        ("Officially recorded heat deaths\nacross all of India, per YEAR",
         "500 – 1,500", 1500, MUTED, "India's official tracking, as reported by Euronews (2026)"),
        ("Modelled excess deaths from\nONE day of extreme heat",
         "~3,400", 3400, EMBER, "Narang & Gadgil, Frontiers in Environmental Health (2026)"),
        ("Modelled excess deaths from\nONE five-day heatwave",
         "~30,000", 30000, CRIMSON, "Narang & Gadgil, Frontiers in Environmental Health (2026)"),
    ]
    x0, xw = 3.05, 3.55
    vmax = 30000
    for i, (label, big, val, col, src) in enumerate(rows):
        y = H - 0.80 - i * 0.98
        ax.text(0.06, y + 0.20, label, fontsize=10.4, color=SLATE,
                va="center", linespacing=1.35, fontweight="bold")
        ax.text(0.06, y - 0.30, src, fontsize=7.4, color=MUTED, va="center")
        rbox(ax, x0, y - 0.02, xw, 0.40, "#EFEBF4", r=0.19)
        # sqrt scale, stated on the figure -- a linear bar would render the
        # official count as a hairline and read as rhetoric rather than data
        frac = (val / vmax) ** 0.5
        rbox(ax, x0, y - 0.02, xw * frac, 0.40, col, r=0.19, z=3)
        ax.text(x0 + xw + 0.16, y + 0.17, big, fontsize=17, fontweight="bold",
                color=col, va="center")
    ax.text(0.06, 0.42, "Bar length uses a square-root scale so the smallest "
                        "value stays visible; the printed numbers are exact.",
            fontsize=8.0, color=MUTED)
    ax.text(0.06, 0.14, "The official figure is annual. The modelled figures "
                        "are per event.", fontsize=8.6, color=CRIMSON,
            fontweight="bold")
    fig.savefig(os.path.join(OUT, "fig_undercount.png"), dpi=220,
                bbox_inches="tight", pad_inches=0.05, facecolor="white")
    plt.close(fig)
    print("wrote fig_undercount.png")


def burden():
    """One national number hides a very uneven distribution."""
    W, H = 8.6, 3.9
    fig, ax = blank(W, H)

    ax.text(0.06, H - 0.30, "A five-day heatwave: ~30,000 modelled excess "
                            "deaths nationally", fontsize=11.6,
            fontweight="bold", color=INK)
    ax.text(0.06, H - 0.56, "That single national figure is the sum of 765 "
                            "districts that carry wildly different burdens.",
            fontsize=9.2, color=MUTED)

    # national bar, with UP's share carved out
    bx, bw, by, bh = 0.06, 8.44, H - 1.34, 0.52
    rbox(ax, bx, by, bw, bh, "#EFEBF4", r=0.06)
    up_frac = 8100 / 30000
    rbox(ax, bx, by, bw * up_frac, bh, CRIMSON, r=0.06, z=3)
    ax.text(bx + 0.14, by + bh / 2, "Uttar Pradesh  ~8,100", fontsize=10.6,
            fontweight="bold", color="#FFFFFF", va="center", zorder=4)
    ax.text(bx + bw * up_frac + 0.16, by + bh / 2,
            "all other states  ~21,900", fontsize=10.0, color=SLATE,
            va="center", zorder=4)
    ax.text(bx, by - 0.22, "One state alone accounts for more than a quarter "
                           "of the national total.", fontsize=8.6, color=MUTED)

    # worst districts
    ax.text(0.06, 1.72, "Highest-burden districts, same five-day event",
            fontsize=10.2, fontweight="bold", color=INK)
    dists = [("Ahmedabad, Gujarat", 307, CRIMSON, "exact figure given"),
             ("Jaipur, Rajasthan", 250, EMBER, "reported as >250"),
             ("Surat, Gujarat", 250, EMBER, "reported as >250")]
    dx, dw, dmax = 2.55, 4.30, 320
    for i, (name, val, col, note) in enumerate(dists):
        y = 1.30 - i * 0.40
        ax.text(0.06, y, name, fontsize=9.6, color=SLATE, va="center")
        rbox(ax, dx, y - 0.11, dw, 0.23, "#EFEBF4", r=0.11)
        rbox(ax, dx, y - 0.11, dw * val / dmax, 0.23, col, r=0.11, z=3)
        ax.text(dx + dw + 0.14, y, f"{val}" + ("+" if val == 250 else ""),
                fontsize=10.4, fontweight="bold", color=col, va="center")
        ax.text(dx + dw + 0.62, y, note, fontsize=7.4, color=MUTED, va="center")

    ax.text(0.06, 0.10, "Source: Narang, P. & Gadgil, A. (2026), "
                        "Frontiers in Environmental Health, "
                        "doi:10.3389/fenvh.2026.1789071",
            fontsize=7.6, color=MUTED)
    fig.savefig(os.path.join(OUT, "fig_burden.png"), dpi=220,
                bbox_inches="tight", pad_inches=0.05, facecolor="white")
    plt.close(fig)
    print("wrote fig_burden.png")


if __name__ == "__main__":
    undercount()
    burden()
