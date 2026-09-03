# -*- coding: utf-8 -*-
"""High-resolution deck visuals, generated from the project's real outputs."""
import json, math, os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import (Polygon as MPoly, FancyBboxPatch, Circle,
                                FancyArrowPatch, Rectangle, RegularPolygon)
from matplotlib.colors import LinearSegmentedColormap, Normalize
import matplotlib.font_manager as fm

DATA = r"C:\Users\HP\sih-heat\web\data"
OUT  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")
os.makedirs(OUT, exist_ok=True)

# ---- palette -------------------------------------------------------------
INK      = "#241043"   # deep indigo
PURPLE   = "#6A1B7A"
MAGENTA  = "#C2185B"
ORANGE   = "#F26522"
AMBER    = "#F9A825"
CREAM    = "#FDEFC9"
SLATE    = "#3A3F52"
MUTED    = "#7A7F91"
PANEL    = "#F4F1F8"
GRIDC    = "#E3DFEC"
GREEN    = "#2E7D5B"
BLUE     = "#0070C0"   # template accent
# aliases shared with the PPTX palette in deckkit.py
CRIMSON  = "#8E1038"
EMBER    = "#D2541F"
STEEL    = "#1B6CA8"
SAND     = "#FDF4E8"
MIST     = "#EEF4F9"

# cool -> hot, unambiguous: pale sand reads cool, deep oxblood reads lethal
HEAT = LinearSegmentedColormap.from_list(
    "heat", ["#FFF6DC", "#FCD98A", "#F5A03C", "#E8562C", "#C2185B", "#6B1030"])

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.sans-serif": ["Calibri", "Arial", "DejaVu Sans"],
    "text.color": SLATE, "axes.labelcolor": SLATE,
    "xtick.color": MUTED, "ytick.color": MUTED,
    "axes.edgecolor": GRIDC, "savefig.dpi": 240,
})

def load(name):
    with open(os.path.join(DATA, name), encoding="utf8") as fh:
        return json.load(fh)

def save(fig, name, transparent=True):
    p = os.path.join(OUT, name)
    fig.savefig(p, dpi=240, transparent=transparent,
                bbox_inches="tight", pad_inches=0.02)
    plt.close(fig)
    print("wrote", p, os.path.getsize(p) // 1024, "KB")

def rbox(ax, x, y, w, h, fc, ec="none", lw=1.2, r=0.045, z=1, alpha=1.0):
    b = FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={r}",
                       fc=fc, ec=ec, lw=lw, zorder=z, alpha=alpha,
                       mutation_aspect=1)
    ax.add_patch(b)
    return b

def blank(w, h):
    fig = plt.figure(figsize=(w, h))
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, w); ax.set_ylim(0, h)
    ax.axis("off")
    return fig, ax


# ---- icons & diagram primitives -----------------------------------------
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
from PIL import Image as _PILImage

ICONS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
_ICO_CACHE = {}
DPI = 240


def ico(ax, name, x, y, size=0.42, alpha=1.0, z=6):
    """Place icon `name` centred at (x, y) data-inches, `size` inches tall."""
    if name not in _ICO_CACHE:
        _ICO_CACHE[name] = np.asarray(
            _PILImage.open(os.path.join(ICONS, name + ".png")).convert("RGBA"))
    img = _ICO_CACHE[name]
    # OffsetImage sizes in points, not pixels: extent = px * zoom * dpi/72,
    # so the zoom that yields `size` inches is size*72/px -- dpi drops out.
    zoom = size * 72.0 / img.shape[0]
    ax.add_artist(AnnotationBbox(
        OffsetImage(img, zoom=zoom, alpha=alpha), (x, y),
        frameon=False, box_alignment=(0.5, 0.5), zorder=z))


def photo(fig, path, x, y, w, h, W, H):
    """Drop a bitmap into a blank() figure at data-inch coords."""
    axi = fig.add_axes([x / W, y / H, w / W, h / H], zorder=4)
    axi.imshow(np.asarray(_PILImage.open(path).convert("RGB")))
    axi.set_xticks([]); axi.set_yticks([])
    for s in axi.spines.values():
        s.set_edgecolor(GRIDC); s.set_linewidth(0.8)
    return axi


def arrow(ax, x1, y1, x2, y2, color=MAGENTA, lw=2.6, z=5, style="-|>", ms=14):
    ax.add_patch(FancyArrowPatch(
        (x1, y1), (x2, y2), arrowstyle=style, mutation_scale=ms,
        color=color, lw=lw, shrinkA=0, shrinkB=0, zorder=z,
        joinstyle="miter", capstyle="butt"))


def label(ax, x, y, text, size=9, bold=False, color=SLATE, ha="left",
          va="center", z=7, ls=1.15, style="normal"):
    return ax.text(x, y, text, fontsize=size, color=color, ha=ha, va=va,
                   zorder=z, linespacing=ls, style=style,
                   fontweight="bold" if bold else "normal")


def caps(ax, x, y, text, size=7.6, color=MUTED, ha="left"):
    return ax.text(x, y, text, fontsize=size, color=color, ha=ha,
                   va="center", zorder=7, fontweight="bold")
