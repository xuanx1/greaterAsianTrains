"""Spot-check the worst K-NN reach offenders to decide which to drop."""
import re, sys, io, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

stations = {}
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*"([^"]*)",\s*native:\s*"([^"]*)",\s*country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations[m.group(1)] = {"name": m.group(2), "country": m.group(4),
                                "lat": float(m.group(5)), "lng": float(m.group(6))}

ROUGH_BBOX = {
    "CN": (15, 73, 54, 135), "MN": (41, 87, 53, 120), "JP": (24, 122, 46, 146),
    "KR": (33, 124, 39, 132), "KP": (37, 124, 43, 131), "IN": (6, 68, 37, 97),
    "RU": (41, 19, 82, 180), "MM": (9, 92, 29, 102), "TH": (5, 97, 21, 106),
    "BD": (20, 88, 27, 93), "LK": (5, 79, 10, 82), "MY": (0, 99, 8, 120),
    "VN": (8, 102, 24, 110), "KZ": (40, 46, 56, 88), "UZ": (37, 55, 46, 74),
    "TM": (35, 52, 43, 67), "TJ": (36, 67, 41, 75), "PK": (23, 60, 38, 78),
    "IR": (24, 44, 40, 64), "SA": (16, 34, 33, 56), "IL": (29, 34, 34, 36),
    "TR": (35, 26, 43, 45), "AM": (38, 43, 42, 47), "AZ": (38, 44, 42, 51),
    "GE": (41, 39, 44, 47), "TW": (21, 119, 26, 123), "HK": (22.1, 113.8, 22.6, 114.5),
    "SG": (1.2, 103.5, 1.5, 104.1), "NP": (26, 80, 31, 89), "KH": (10, 102, 15, 108),
    "LA": (13, 100, 23, 108),
}

out = []
for sid, s in stations.items():
    bb = ROUGH_BBOX.get(s["country"])
    if not bb: continue
    if not (bb[0] <= s["lat"] <= bb[2] and bb[1] <= s["lng"] <= bb[3]):
        out.append((sid, s))
print(f"stations outside their claimed country's bbox: {len(out)}")
for sid, s in out:
    # Try to identify likely correct country
    likely = None
    for cc, bb in ROUGH_BBOX.items():
        if cc == s["country"]: continue
        if bb[0] <= s["lat"] <= bb[2] and bb[1] <= s["lng"] <= bb[3]:
            likely = cc; break
    print(f"  {sid} {s['name']:>30} (claimed {s['country']}) at [{s['lat']:.2f},{s['lng']:.2f}] — likely {likely}")
