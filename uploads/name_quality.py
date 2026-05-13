"""Reusable OSM station-name quality filter.

Returns True if a name (en or local) looks like a real station label.
Rejects: km markers, № markers, pure numerics, sidings, depots, ports,
airports, schools, generic single-word labels ("Station", "Departure
Station", "East Station"), terminal-buses, garages, etc.
"""
import re

_BAD_KEYWORDS = (
    "siding", "разъезд", "разьезд",
    "depo", "депо", "depot",
    "terminal bus", "bus terminal", "bus stop",
    "школа", "school", "elementary", "primary school",
    "university", "университет", "college",
    "museum", "hospital", "больница", "церковь",
    "garage", "warehouse", "barrack", "склад",
    "embankment",
)

_BAD_EXACT = {
    "station", "departure station", "east station", "west station",
    "north station", "south station", "central station", "main station",
    "old station", "new station", "freight station",
    "passenger station", "terminus", "halt", "platform",
    "yard", "junction",
    "разъезд", "пункт", "остановка", "пост",
}

# Patterns that fully match → reject
_KM_RE = re.compile(r"^\s*[\d\.,]+\s*(?:[kк]m|км|km|km)\s*$", re.IGNORECASE)
_NUMERIC_RE = re.compile(r"^\s*[\d\.,]+\s*$")
_NUM_HASH_RE = re.compile(r"^\s*(?:№|n[°o]?\.?|no\.?|#)\s*[\d]+\s*$", re.IGNORECASE)
# "Pikettnyy post 123" / "пикет 123" etc.
_PIKET_RE = re.compile(r"^\s*(?:пк|piket|pk)\s*[\d]+\s*$", re.IGNORECASE)
# "Razezd No 21", "разъезд №X"
_RAZEZD_RE = re.compile(r"^\s*(?:siding|разъезд|разьезд)\b.*", re.IGNORECASE)
# Airport terminals
_AIRPORT_RE = re.compile(r"(int['’]?l|international)?\s*airport\s*(terminal\b.*)?$", re.IGNORECASE)

def is_acceptable(name_en: str, name_local: str) -> bool:
    """name_en may be empty; name_local is the fallback (e.g. Cyrillic)."""
    n = (name_en or "").strip() or (name_local or "").strip()
    if not n: return False
    low = n.lower()
    # short pure-numeric or km marker
    if _KM_RE.match(n): return False
    if _NUMERIC_RE.match(n): return False
    if _NUM_HASH_RE.match(n): return False
    if _PIKET_RE.match(n): return False
    if _RAZEZD_RE.match(n): return False
    if low in _BAD_EXACT: return False
    for kw in _BAD_KEYWORDS:
        if kw in low: return False
    # Reject pure airport-terminal labels — but keep "Airport" if combined
    # with a city/line name (e.g. "Narita Airport").
    if _AIRPORT_RE.fullmatch(low): return False
    # Reject things like "Stasiun" or "Pl." that are just generic
    if low in ("stasiun", "halte", "пл."): return False
    # Single char / too short
    if len(n.strip()) < 2: return False
    return True


if __name__ == "__main__":
    import sys, io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    tests = [
        ("Departure Station", ""),
        ("East Station", "Восточная"),
        ("Siding № 2", "Бекет № 2"),
        ("80 км", ""),
        ("№ 21", ""),
        ("198km", ""),
        ("285 км", "285 км"),
        ("Qurıq port", "Құрық порты"),
        ("Incheon Int'l Airport Terminal 2", "인천공항2터미널"),
        ("Narita Airport", "成田空港"),
        ("Vladivostok", "Владивосток"),
        ("Tai'an", "泰安"),
        ("212 км", "212 км"),
        ("Terminal Bus", ""),
        ("", "Электросталь"),
        ("1437 km", "1437 км"),
        ("Stasiun Parungkuda", ""),
    ]
    for en, ru in tests:
        ok = is_acceptable(en, ru)
        mark = "KEEP" if ok else "DROP"
        print(f"  {mark}  en='{en}' ru='{ru}'")
