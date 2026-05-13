import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
s = open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\app.jsx',encoding='utf-8').read()
i = s.find('NFD')
print('NFD context (chars around):')
chunk = s[i:i+80]
for c in chunk:
    if ord(c) < 0x20 or ord(c) > 0x7e:
        print(f"  {hex(ord(c))} {c!r}")
    else:
        print(f"  {hex(ord(c))} {c!r}")
