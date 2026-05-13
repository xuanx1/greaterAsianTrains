"""Extract all stations from stations.gpkg with WKB-decoded coordinates."""
import sqlite3, struct, json, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

p = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations.gpkg'
conn = sqlite3.connect(p)
conn.text_factory = str
cur = conn.cursor()

def decode_gpkg_point(blob):
    # GPKG binary header: magic(2)="GP", version(1), flags(1), srs_id(4),
    # envelope (optional), then WKB.
    if blob is None: return None, None
    if blob[:2] != b'GP':
        return None, None
    flags = blob[3]
    envelope_code = (flags >> 1) & 0x07
    env_sizes = {0:0, 1:32, 2:48, 3:48, 4:64}
    header_len = 8 + env_sizes.get(envelope_code, 0)
    wkb = blob[header_len:]
    byte_order = wkb[0]
    endian = '<' if byte_order == 1 else '>'
    wkb_type = struct.unpack(endian + 'I', wkb[1:5])[0]
    # POINT = 1; could include SRID/Z/M variants
    if (wkb_type & 0xFF) != 1:
        return None, None
    offset = 5
    if wkb_type & 0x20000000:  # SRID
        offset += 4
    x, y = struct.unpack(endian + 'dd', wkb[offset:offset+16])
    return x, y  # lon, lat

cur.execute("SELECT fid, geometry, name_ru, name_en, note, status, name_long FROM stations ORDER BY fid")
rows = []
for fid, geom, name_ru, name_en, note, status, name_long in cur.fetchall():
    lon, lat = decode_gpkg_point(geom)
    rows.append({
        "fid": fid, "lat": lat, "lng": lon,
        "name_ru": name_ru, "name_en": name_en,
        "note": note, "status": status, "name_long": name_long,
    })

print(f"total rows: {len(rows)}")
print(f"with coords: {sum(1 for r in rows if r['lat'] is not None)}")
print("status counts:")
from collections import Counter
print(Counter(r["status"] for r in rows))

# Save JSON
with open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations.json', 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)

print("\nSample rows:")
for r in rows[:5]:
    print(r)
