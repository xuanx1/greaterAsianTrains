"""Strip duplicate native:"X", native:"X" in data.js (Taiwan entries)."""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
p = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js'
s = open(p, encoding='utf-8').read()
pat = re.compile(r'native:\s*"([^"]+)",\s+native:\s*"\1"')
hits = pat.findall(s)
print(f"duplicate native fields found: {len(hits)}")
for h in hits: print("  ", h)
s2 = pat.sub(r'native: "\1"', s)
open(p, 'w', encoding='utf-8').write(s2)
print("patched")
