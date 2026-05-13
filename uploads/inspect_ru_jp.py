import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
d = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\mismatched.json', encoding='utf-8'))
for x in d:
    if x['claimed'] == 'RU' and x['actual'] == 'JP':
        print(f"  {x['id']:>30}  {x['name']:>30}  at [{x['lat']:.3f},{x['lng']:.3f}]")
