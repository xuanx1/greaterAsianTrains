"""Count stations per country across all three files."""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from collections import Counter

counts = Counter()
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'id:\s*"[^"]+",[^}]*?country:\s*"([A-Z]{2})"', s):
        counts[m.group(1)] += 1

total = sum(counts.values())
print(f"Total stations: {total}")
print(f"By country:")
for cc, c in counts.most_common():
    print(f"  {cc}: {c}")

# Route counts
route_count = 0
hsr_count = 0
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'from:\s*"[^"]+",\s*to:\s*"[^"]+",[^}]*?type:\s*"([a-z]+)"', s):
        route_count += 1
        if m.group(1) == "hsr":
            hsr_count += 1
print(f"\nTotal routes: {route_count} (hsr: {hsr_count}, conv: {route_count - hsr_count})")
