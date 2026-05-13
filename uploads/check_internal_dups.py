"""List the gpkg internal name-dup stations."""
import json, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def normalize(s):
    if s is None: return ""
    s = s.strip().lower().replace("ё","е")
    return re.sub(r"[\s\-\.\(\)']+","", s)

stations = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations.json', encoding='utf-8'))

en_groups, ru_groups = {}, {}
for r in stations:
    n_en = normalize(r["name_en"])
    n_ru = normalize(r["name_ru"])
    if n_en: en_groups.setdefault(n_en, []).append(r)
    if n_ru: ru_groups.setdefault(n_ru, []).append(r)

print("English-name collisions inside gpkg:")
for k, v in en_groups.items():
    if len(v) > 1:
        print(f"  '{k}':")
        for r in v:
            print(f"    fid={r['fid']} en='{r['name_en']}' ru='{r['name_ru']}' [{r['lat']:.3f},{r['lng']:.3f}]")

print("\nRussian-name collisions inside gpkg:")
for k, v in ru_groups.items():
    if len(v) > 1:
        print(f"  '{k}':")
        for r in v:
            print(f"    fid={r['fid']} en='{r['name_en']}' ru='{r['name_ru']}' [{r['lat']:.3f},{r['lng']:.3f}]")
