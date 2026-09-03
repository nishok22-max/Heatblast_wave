# -*- coding: utf-8 -*-
"""Data charts for the SIH deck, all computed from web/data outputs."""
from figs import *


# ---------------------------------------------------------------- 1. spread
def indices():
    """The signature finding: same city, same instant, three measures disagree."""
    rows = [
        ("Air temperature", 3.00, 1.00, "#F5A03C",
         "what today's warning uses"),
        ("Heat stress for workers (WBGT)", 1.39, 0.46, "#C2185B",
         "damped — under-reads dry heat"),
        ("What the heat feels like (UTCI)", 3.88, 1.29, "#6B1030",
         "amplified — the honest layer"),
    ]
    W, H = 7.6, 2.35
    fig, ax = blank(W, H)
    x0, xw, vmax = 3.34, 2.62, 4.2
    for i, (lab, val, mult, col, note) in enumerate(rows):
        y = H - 0.45 - i * 0.62
        ax.text(0.06, y + 0.13, lab, fontsize=11.0, fontweight="bold",
                color=SLATE, va="center")
        ax.text(0.06, y - 0.15, note, fontsize=8.8, color=MUTED, va="center")
        rbox(ax, x0, y - 0.06, xw, 0.34, "#EDE9F2", r=0.17)
        rbox(ax, x0, y - 0.06, xw * val / vmax, 0.34, col, r=0.17, z=3)
        ax.text(x0 + xw + 0.15, y + 0.13, f"{val:.2f} °C", fontsize=14.5,
                fontweight="bold", color=col, va="center")
        ax.text(x0 + xw + 0.15, y - 0.15, f"×{mult:.2f} vs air temp",
                fontsize=8.8, color=MUTED, va="center")
    ax.text(0.06, 0.10,
            "Coolest-to-hottest spread across 392 neighbourhoods, "
            "same city · same minute",
            fontsize=9.0, color=MUTED)
    save(fig, "v_indices.png")


# ----------------------------------------------------------- 2. sensitivity
def sensitivity():
    """Honest uncertainty: does the finding survive the assumed UHI amplitude?"""
    amp = [2.0, 3.0, 4.0, 5.0]
    utci = [2.57, 3.88, 5.20, 6.53]
    fig = plt.figure(figsize=(5.5, 3.05))
    ax = fig.add_axes([0.115, 0.185, 0.865, 0.685])
    cols = ["#F5A03C" if a != 3.0 else "#C2185B" for a in amp]
    bars = ax.bar([str(a) for a in amp], utci, width=0.56, color=cols, zorder=3)
    ax.axhline(3.0, color=GREEN, lw=1.8, ls=(0, (5, 3)), zorder=4)
    ax.text(-0.42, 3.16, "PROCEED threshold 3.0 °C", fontsize=8.6, color=GREEN,
            fontweight="bold", ha="left", va="bottom")
    for b, v in zip(bars, utci):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.18, f"{v:.2f}",
                ha="center", fontsize=10.6, fontweight="bold", color=SLATE)
    ax.annotate("our config", xy=(0.76, 4.10), xytext=(0.02, 5.55), ha="left",
                va="center", fontsize=9.2, fontweight="bold", color="#C2185B",
                arrowprops=dict(arrowstyle="->", color="#C2185B", lw=1.5,
                                connectionstyle="arc3,rad=-0.25"))
    ax.set_ylim(0, 7.6)
    ax.set_xlabel("Assumed urban-heat amplitude (°C) — the one input we did not measure",
                  fontsize=9.0, labelpad=6)
    ax.set_ylabel("UTCI spread (°C)", fontsize=9.4)
    ax.set_title("Every value in the published range still clears the gate",
                 fontsize=11.0, fontweight="bold", color=SLATE, loc="left", pad=9)
    ax.grid(axis="y", color=GRIDC, lw=0.8, zorder=0)
    ax.set_axisbelow(True)
    for sp in ("top", "right", "left"):
        ax.spines[sp].set_visible(False)
    ax.tick_params(labelsize=9.4, length=0)
    save(fig, "v_sensitivity.png")


# ------------------------------------------------------------ 3. work safety
def worksafety():
    """Safe outdoor working minutes per hour, per persona — ISO 7243 + ACGIH."""
    d = load("personas.json")["personas"]
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
    ax.imshow(grid, aspect="auto", cmap=cmap, vmin=0, vmax=60,
              interpolation="nearest")
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
    ax.set_title("Minutes of outdoor work permitted per hour — 21 May 2010",
                 fontsize=10.8, fontweight="bold", color=SLATE, loc="left", pad=8)

    tot = fig.add_axes([0.905, 0.185, 0.09, 0.645])
    tot.axis("off")
    tot.set_xlim(0, 1)
    tot.set_ylim(len(order) - 0.5, -0.5)
    tot.text(0.5, -0.78, "SAFE\nHOURS", ha="center", va="center", fontsize=7.6,
             fontweight="bold", color=MUTED, linespacing=1.35)
    for i, k in enumerate(order):
        tot.text(0.5, i, f"{d[k]['total_safe_hours']:.1f} h", ha="center",
                 va="center", fontsize=11.2, fontweight="bold", color="#8E1038")
    save(fig, "v_worksafety.png")


# ---------------------------------------------------------- 4. night recovery
def nights():
    """The killer nobody warns about: nights that never cool down."""
    d = load("city.json")["night_recovery"]
    dates = [x["date"][-5:] for x in d]
    mins = [x["min_c"] for x in d]
    maxs = [x["max_c"] for x in d]
    fig = plt.figure(figsize=(5.9, 3.05))
    ax = fig.add_axes([0.105, 0.185, 0.875, 0.665])
    xs = np.arange(len(d))
    ax.fill_between(xs, mins, maxs, color="#F5A03C", alpha=0.28, zorder=2)
    ax.plot(xs, maxs, color="#F5A03C", lw=2.0, marker="o", ms=4.2, zorder=3,
            label="daytime max")
    ax.plot(xs, mins, color="#8E1038", lw=2.6, marker="o", ms=5.0, zorder=4,
            label="overnight min")
    ax.axhline(27, color=SLATE, lw=1.5, ls=(0, (5, 3)), zorder=5)
    ax.text(-0.45, 26.15, "27 °C — below this a body recovers overnight",
            fontsize=8.4, color=SLATE, ha="left", va="center")

    # longest *consecutive* run of nights that never dropped below 27 °C
    run = best = (0, -1)
    for i, m in enumerate(mins):
        run = (run[0] + 1, i) if m >= 27 else (0, -1)
        if run[0] > best[0]:
            best = run
    n, end = best
    if n >= 2:
        ax.axvspan(end - n + 1 - 0.45, end + 0.45, color="#8E1038",
                   alpha=0.08, zorder=1)
        ax.text(end - (n - 1) / 2, 24.55,
                f"{n} consecutive nights with no recovery",
                ha="center", fontsize=9.4, fontweight="bold", color="#8E1038")
    ax.set_xticks(xs)
    ax.set_xticklabels(dates, fontsize=8.4)
    ax.set_ylim(23.9, 39.2)
    ax.set_ylabel("Air temperature (°C)", fontsize=9.4)
    ax.set_title("A daytime-maximum warning is blind to this",
                 fontsize=11.0, fontweight="bold", color=SLATE, loc="left", pad=9)
    ax.grid(axis="y", color=GRIDC, lw=0.8, zorder=0)
    ax.set_axisbelow(True)
    for sp in ("top", "right", "left"):
        ax.spines[sp].set_visible(False)
    ax.tick_params(labelsize=9.0, length=0)
    ax.legend(fontsize=8.6, frameon=False, loc="upper left", ncols=2,
              handlelength=1.5, columnspacing=1.2)
    save(fig, "v_nights.png")


if __name__ == "__main__":
    indices()
    sensitivity()
    worksafety()
    nights()
