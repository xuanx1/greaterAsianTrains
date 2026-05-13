import sqlite3, struct, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

p = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations-directions.gpkg'
conn = sqlite3.connect(p)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("tables:", [r[0] for r in cur.fetchall()])
cur.execute("SELECT table_name, data_type, identifier, description FROM gpkg_contents")
for r in cur.fetchall():
    print(" content:", r)

# pick the feature table
cur.execute("SELECT table_name FROM gpkg_contents WHERE data_type='features'")
tbl = cur.fetchone()[0]
print(f"\n--- {tbl} schema ---")
cur.execute(f"PRAGMA table_info('{tbl}')")
for c in cur.fetchall(): print(" ", c)
cur.execute(f"SELECT COUNT(*) FROM '{tbl}'")
print("count:", cur.fetchone()[0])

cur.execute(f"SELECT * FROM '{tbl}' LIMIT 5")
cols = [d[0] for d in cur.description]
print("cols:", cols)
for row in cur.fetchall():
    vals = []
    for c, v in zip(cols, row):
        if c == 'geometry':
            vals.append(f"<geom {len(v) if v else 0}B>")
        else:
            vals.append(f"{c}={v!r}")
    print(" ", " | ".join(vals))
