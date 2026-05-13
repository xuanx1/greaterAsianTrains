import sqlite3, sys

p = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations.gpkg'
conn = sqlite3.connect(p)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("TABLES:", tables)

cur.execute("SELECT table_name, data_type, identifier FROM gpkg_contents")
print("\nGPKG_CONTENTS:")
for r in cur.fetchall():
    print(" ", r)

for t in tables:
    if t.startswith("gpkg_") or t.startswith("rtree_") or t.startswith("sqlite_"):
        continue
    print(f"\n--- {t} ---")
    cur.execute(f"PRAGMA table_info('{t}')")
    cols = cur.fetchall()
    for c in cols:
        print(" ", c)
    cur.execute(f"SELECT COUNT(*) FROM '{t}'")
    print("  count:", cur.fetchone()[0])
    cur.execute(f"SELECT * FROM '{t}' LIMIT 3")
    for row in cur.fetchall():
        print("  row:", [str(v)[:80] for v in row])
