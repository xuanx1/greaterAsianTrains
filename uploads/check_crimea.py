"""Flag potentially sensitive (Crimea, occupied Ukraine, Kaliningrad) stations."""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
stations = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations.json', encoding='utf-8'))

# Crimea: ~44.4-46.2 N, 32.5-36.7 E
# Kaliningrad: ~54.4-55.3 N, 19.6-22.9 E
# Donbas / Luhansk: ~47-50 N, 37-40.5 E (overlaps with Russian Rostov; tricky)
print("CRIMEA candidates:")
for r in stations:
    if 44.0 <= r["lat"] <= 46.3 and 32.5 <= r["lng"] <= 37.0:
        print(f"  fid={r['fid']} {r['name_en']} ({r['name_ru']}) [{r['lat']:.2f},{r['lng']:.2f}] status={r['status']}")
print("\nKALININGRAD candidates:")
for r in stations:
    if 54.0 <= r["lat"] <= 55.5 and 19.0 <= r["lng"] <= 23.0:
        print(f"  fid={r['fid']} {r['name_en']} ({r['name_ru']}) [{r['lat']:.2f},{r['lng']:.2f}] status={r['status']}")
print("\nBelarus/Ukraine border (outside RU territory ~50-53N 24-31E):")
for r in stations:
    if 49.0 <= r["lat"] <= 53.5 and 22.0 <= r["lng"] <= 30.0:
        print(f"  fid={r['fid']} {r['name_en']} ({r['name_ru']}) [{r['lat']:.2f},{r['lng']:.2f}] status={r['status']}")
