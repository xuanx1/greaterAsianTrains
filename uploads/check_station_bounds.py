"""What lat/lng range do our actual stations span?"""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

lats, lngs = [], []
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        lats.append(float(m.group(1)))
        lngs.append(float(m.group(2)))
print(f"stations: {len(lats)}")
print(f"  lat range: {min(lats):.2f} → {max(lats):.2f}")
print(f"  lng range: {min(lngs):.2f} → {max(lngs):.2f}")

# Stations outside current grid (-12..62 lat, 25..145 lng):
out = [(la, ln) for la, ln in zip(lats, lngs) if not (-12 <= la <= 62 and 25 <= ln <= 145)]
print(f"\nstations outside current grid (-12..62 lat, 25..145 lng): {len(out)}")
print(f"  northernmost: {max(out, key=lambda x:x[0]) if out else 'n/a'}")
print(f"  westernmost: {min(out, key=lambda x:x[1]) if out else 'n/a'}")
print(f"  easternmost: {max(out, key=lambda x:x[1]) if out else 'n/a'}")
print(f"  southernmost: {min(out, key=lambda x:x[0]) if out else 'n/a'}")

# What the new grid should be (with a small buffer)
print(f"\nrecommended new grid:")
print(f"  GRID_LAT_MIN = {min(lats) - 2:.0f}, GRID_LAT_MAX = {max(lats) + 2:.0f}")
print(f"  GRID_LNG_MIN = {min(lngs) - 2:.0f}, GRID_LNG_MAX = {max(lngs) + 2:.0f}")
