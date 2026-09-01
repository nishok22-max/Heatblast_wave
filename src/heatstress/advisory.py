"""Public-health advisories and machine-readable alerts.

Two outputs, for two audiences:

  * ``advisory_text`` -- what a person reads, in their own language, written for
    low literacy: short sentences, concrete actions, no jargon, no numbers that
    require interpretation.
  * ``cap_alert`` -- CAP 1.2 XML, the Common Alerting Protocol. This is the
    format NDMA's own SACHET platform speaks, and the international standard for
    public warning. Emitting valid CAP is the difference between a demo that
    ends at a dashboard and a system that could plug into national alerting
    infrastructure.

NOTHING HERE SENDS ANYTHING. Both functions return strings for display. Wiring a
real SMS/WhatsApp/IVR gateway is a V1 item and needs explicit authorisation --
an alerting system that can fire on its own during a demo is a liability.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from xml.etree import ElementTree as ET

__all__ = [
    "Advisory",
    "advisory_text",
    "cap_alert",
    "severity_for",
    "ADVISORY_TEMPLATES",
]

IST = timezone(timedelta(hours=5, minutes=30))

# CAP severity maps onto our UTCI/WBGT bands. CAP's own vocabulary is fixed:
# Extreme / Severe / Moderate / Minor / Unknown.
_SEVERITY_BANDS = [
    (46.0, "Extreme", "red"),
    (38.0, "Severe", "orange"),
    (32.0, "Moderate", "yellow"),
    (26.0, "Minor", "green"),
]


def severity_for(utci_c: float) -> tuple[str, str]:
    """Return (CAP severity, colour) for a UTCI value."""
    for threshold, severity, colour in _SEVERITY_BANDS:
        if utci_c >= threshold:
            return severity, colour
    return "Unknown", "grey"


# Advisory copy, per language, per severity.
#
# Written deliberately plainly. A large share of the people most exposed to heat
# in an Indian city are outdoor informal workers and elderly residents; an
# English advisory quoting "WBGT 33.8 degC" reaches none of them. Numbers are kept
# out of the body text entirely -- the action is the message.
#
# ###################################################################
# #  TRANSLATIONS ARE UNVERIFIED AND MUST NOT BE PUBLISHED AS-IS.   #
# ###################################################################
#
# The Hindi and Gujarati strings below were machine-composed, not written or
# reviewed by a native speaker. An earlier draft of this file silently contained
# a stray digit and a Lao codepoint inside the Gujarati text -- exactly the kind
# of corruption that is invisible to someone who cannot read the script.
#
# Garbled safety instructions are worse than none: a heat advisory that reads as
# nonsense destroys trust in every subsequent alert. So:
#
#   * ``LANGUAGES_VERIFIED`` gates what the UI may present as usable.
#   * Unverified languages are still emitted, but flagged, so a reviewer can see
#     and correct them.
#   * Get these checked by a native speaker before any pitch, and certainly
#     before any real dispatch.
LANGUAGES_VERIFIED: dict[str, bool] = {"en": True, "hi": False, "gu": False}

ADVISORY_TEMPLATES: dict[str, dict[str, str]] = {
    "en": {
        "Extreme": ("DANGEROUS HEAT. Do not work outside. Stay in shade. "
                    "Drink water every 15 minutes. Check on elderly neighbours. "
                    "If someone stops sweating or becomes confused, call 108."),
        "Severe": ("VERY HOT. Stop outdoor work between 11 am and 5 pm. "
                   "Rest in shade every hour. Drink water often, even if not "
                   "thirsty. Check on elderly neighbours."),
        "Moderate": ("HOT. Take a shade break every hour if working outside. "
                     "Keep drinking water. Avoid heavy work at midday."),
        "Minor": ("WARM. Drink water regularly. Take breaks in shade."),
    },
    "hi": {
        "Extreme": ("खतरनाक गर्मी। "
                    "बाहर काम न करें। "
                    "छाया में रहें। "
                    "हर 15 मिनट में पानी "
                    "पिएँ। बुजुर्गों "
                    "का ध्यान रखें। "
                    "किसी को चक्कर आए "
                    "तो 108 पर कॉल करें।"),
        "Severe": ("बहुत गर्मी। "
                   "सुबह 11 से शाम 5 बजे "
                   "तक बाहर काम बंद "
                   "रखें। हर घंटे "
                   "छाया में आराम "
                   "करें। पानी पीते "
                   "रहें।"),
        "Moderate": ("गर्मी। हर घंटे "
                     "छाया में आराम "
                     "करें। पानी पीते "
                     "रहें।"),
        "Minor": ("गर्म मौसम। पानी "
                  "पीते रहें।"),
    },
    "gu": {
        "Extreme": ("ખતરનાક ગરમી. બહાર કામ ન કરો. છાંયામાં રહો. "
                    "દર ૧૫ મિનિટે પાણી પીઓ. વડીલોનું ધ્યાન રાખો. "
                    "કોઈને ચક્કર આવે તો ૧૦૮ પર ફોન કરો."),
        "Severe": ("ખૂબ ગરમી. સવારે ૧૧ થી સાંજે ૫ સુધી બહાર કામ બંધ રાખો. "
                   "દર કલાકે છાંયામાં આરામ કરો. પાણી પીતા રહો."),
        "Moderate": ("ગરમી. બહાર કામ કરતા હો તો દર કલાકે છાંયામાં આરામ કરો. "
                     "પાણી પીતા રહો."),
        "Minor": ("ગરમ હવામાન. નિયમિત પાણી પીતા રહો."),
    },
}


def is_verified(language: str) -> bool:
    """Whether this language's copy has been reviewed by a native speaker.

    The UI must show an explicit 'unverified translation' marker wherever this
    is False, and no unverified string may ever be dispatched to the public.
    """
    return LANGUAGES_VERIFIED.get(language, False)


@dataclass
class Advisory:
    """A composed advisory for one zone at one time."""

    zone_id: str
    city: str
    issued_ist: str
    utci_c: float
    wbgt_c: float
    severity: str
    colour: str
    headline: str
    text: dict[str, str]
    safe_work_note: str


def advisory_text(utci_c: float, language: str = "en") -> str:
    """Return the public advisory body for a UTCI value, in one language."""
    severity, _ = severity_for(utci_c)
    templates = ADVISORY_TEMPLATES.get(language, ADVISORY_TEMPLATES["en"])
    return templates.get(severity, templates["Minor"])


def build_advisory(zone_id: str, city: str, issued_ist: str, utci_c: float,
                   wbgt_c: float, safe_work_minutes: float) -> Advisory:
    """Compose the full multi-language advisory for one zone."""
    severity, colour = severity_for(utci_c)
    if safe_work_minutes <= 0:
        note = "No safe outdoor work at this hour."
    elif safe_work_minutes >= 60:
        note = "Outdoor work permissible with normal precautions."
    else:
        note = (f"Outdoor heavy work limited to {safe_work_minutes:.0f} minutes "
                f"per hour, with the remainder resting in shade.")

    return Advisory(
        zone_id=zone_id, city=city, issued_ist=issued_ist,
        utci_c=round(float(utci_c), 1), wbgt_c=round(float(wbgt_c), 1),
        severity=severity, colour=colour,
        headline=f"{severity} heat stress - {city} zone {zone_id[-6:]}",
        text={lang: advisory_text(utci_c, lang) for lang in ADVISORY_TEMPLATES},
        safe_work_note=note,
    )


def cap_alert(advisory: Advisory, sender: str = "heatstress@sih.prototype",
              expires_hours: int = 6, polygon: list[list[float]] | None = None) -> str:
    """Serialise an Advisory as CAP 1.2 XML.

    CAP 1.2 (OASIS) is what NDMA's SACHET platform and Google Public Alerts
    consume. Producing valid CAP costs almost nothing and means the system speaks
    the same language as national alerting infrastructure rather than being a
    closed dashboard.

    ``polygon`` is a GeoJSON-style ring of [lon, lat] pairs; CAP wants
    "lat,lon lat,lon ..." with the ring closed, so it is transposed here.
    """
    ns = "urn:oasis:names:tc:emergency:cap:1.2"
    ET.register_namespace("", ns)
    root = ET.Element(f"{{{ns}}}alert")

    issued = datetime.now(IST).isoformat(timespec="seconds")
    digest = hashlib.sha1(
        f"{advisory.zone_id}{advisory.issued_ist}".encode()).hexdigest()[:16]

    def sub(parent, tag, text):
        element = ET.SubElement(parent, f"{{{ns}}}{tag}")
        element.text = str(text)
        return element

    sub(root, "identifier", f"SIH-HEAT-{digest}")
    sub(root, "sender", sender)
    sub(root, "sent", issued)
    sub(root, "status", "Exercise")     # NOT 'Actual' -- this is a prototype
    sub(root, "msgType", "Alert")
    sub(root, "scope", "Public")
    sub(root, "note", "PROTOTYPE / EXERCISE. Not an official warning.")

    info = ET.SubElement(root, f"{{{ns}}}info")
    sub(info, "language", "en-IN")
    sub(info, "category", "Health")
    sub(info, "event", "Extreme Heat")
    sub(info, "responseType", "Prepare")
    sub(info, "urgency", "Expected")
    sub(info, "severity", advisory.severity)
    sub(info, "certainty", "Likely")
    sub(info, "onset", advisory.issued_ist)
    sub(info, "expires",
        (datetime.now(IST) + timedelta(hours=expires_hours)).isoformat(timespec="seconds"))
    sub(info, "senderName", f"Heat Stress Early Warning ({advisory.city})")
    sub(info, "headline", advisory.headline)
    sub(info, "description", advisory.text["en"])
    sub(info, "instruction", advisory.safe_work_note)

    for name, value in (("UTCI_C", advisory.utci_c),
                        ("WBGT_C", advisory.wbgt_c),
                        ("H3_CELL", advisory.zone_id)):
        parameter = ET.SubElement(info, f"{{{ns}}}parameter")
        sub(parameter, "valueName", name)
        sub(parameter, "value", value)

    area = ET.SubElement(info, f"{{{ns}}}area")
    sub(area, "areaDesc", f"{advisory.city} - zone {advisory.zone_id}")
    if polygon:
        ring = " ".join(f"{lat:.5f},{lon:.5f}" for lon, lat in polygon)
        sub(area, "polygon", ring)

    ET.indent(root, space="  ")
    return ET.tostring(root, encoding="unicode", xml_declaration=True)
