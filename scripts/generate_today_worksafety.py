# -*- coding: utf-8 -*-
"""Generate work safety grid for TODAY'S live forecast data, matching v_worksafety.png."""
import os
import sys
import json
from datetime import datetime
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "docs", "deck"))
from figs import SLATE, MUTED, GRIDC

LIVE_PERSONAS_PATH = os.path.join(ROOT, "web", "data", "live", "personas.json")
OUT_IMG_DIR = os.path.join(ROOT, "docs", "deck", "img")
OUT_PATH = os.path.join(OUT_IMG_DIR, "v_worksafety_today.png")
CONVERSATION_DIR = r"C:\Users\HP\.gemini\antigravity-ide\brain\80a8c7ac-9ef3-47b5-9608-463ba61b64e5"

def generate_today_worksafety(date_override=None, title_override=None):
    with open(LIVE_PERSONAS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    d = data["personas"]
    raw_date = data.get("date", "2026-09-03")
    try:
        dt = datetime.strptime(raw_date, "%Y-%m-%d")
        formatted_date = dt.strftime("%d %B %Y").lstrip("0")
    except Exception:
        formatted_date = raw_date

    title = title_override or f"Minutes of outdoor work permitted per hour — {formatted_date}"

    order = [k for k in ("construction", "delivery", "child", "elderly") if k in d]
    order += [k for k in d if k not in order]
    labels = {
        "construction": "Outdoor construction worker",
        "delivery": "Delivery rider",
        "child": "School child, outdoors",
        "elderly": "Woman, 78, on blood-\npressure medication",
    }
    grid = np.array([d[k]["safe_minutes_by_hour"] for k in order], float)

    fig = plt.figure(figsize=(8.9, 2.55))
    ax = fig.add_axes([0.225, 0.185, 0.675, 0.645])
    cmap = LinearSegmentedColormap.from_list(
        "safe", ["#8E1038", "#E8562C", "#F5A03C", "#FCD98A", "#D8EDE0"])
    
    ax.imshow(grid, aspect="auto", cmap=cmap, vmin=0, vmax=60, interpolation="nearest")
    
    for i in range(grid.shape[0]):
        for j in range(grid.shape[1]):
            v = grid[i, j]
            ax.text(j, i, f"{int(v)}", ha="center", va="center", fontsize=6.5,
                    color="#FFFFFF" if v <= 15 else SLATE,
                    fontweight="bold" if v == 0 else "normal")
                    
    ax.set_xticks(range(0, 24, 3))
    ax.set_xticklabels([f"{h:02d}" for h in range(0, 24, 3)], fontsize=8.6)
    ax.set_yticks(range(len(order)))
    ax.set_yticklabels([labels.get(k, d[k]["label"]) for k in order],
                       fontsize=8.9, linespacing=1.3)
    ax.tick_params(length=0)
    for sp in ax.spines.values():
        sp.set_visible(False)
        
    ax.set_xlabel("Hour of day (IST)", fontsize=9.0, labelpad=4)
    ax.set_title(title, fontsize=10.8, fontweight="bold", color=SLATE, loc="left", pad=8)

    tot = fig.add_axes([0.905, 0.185, 0.09, 0.645])
    tot.axis("off")
    tot.set_xlim(0, 1)
    tot.set_ylim(len(order) - 0.5, -0.5)
    tot.text(0.5, -0.78, "SAFE\nHOURS", ha="center", va="center", fontsize=7.6,
             fontweight="bold", color=MUTED, linespacing=1.35)
             
    for i, k in enumerate(order):
        tot.text(0.5, i, f"{d[k]['total_safe_hours']:.1f} h", ha="center",
                 va="center", fontsize=11.2, fontweight="bold", color="#8E1038")

    # Save transparent
    fig.savefig(OUT_PATH, dpi=240, transparent=True, bbox_inches="tight", pad_inches=0.02)
    
    # Also save to conversation directory for immediate preview
    artifact_copy = os.path.join(CONVERSATION_DIR, "v_worksafety_today.png")
    fig.savefig(artifact_copy, dpi=240, transparent=True, bbox_inches="tight", pad_inches=0.02)
    
    # Also save a crisp white background version in case user prefers it on white docs
    white_copy = os.path.join(OUT_IMG_DIR, "v_worksafety_today_white.png")
    fig.savefig(white_copy, dpi=240, transparent=False, facecolor="white", bbox_inches="tight", pad_inches=0.02)
    white_artifact = os.path.join(CONVERSATION_DIR, "v_worksafety_today_white.png")
    fig.savefig(white_artifact, dpi=240, transparent=False, facecolor="white", bbox_inches="tight", pad_inches=0.02)
    
    plt.close(fig)
    print(f"Generated today's work safety image:")
    print(f"  Transparent: {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)")
    print(f"  White bg:    {white_copy} ({os.path.getsize(white_copy)} bytes)")

if __name__ == "__main__":
    generate_today_worksafety()
