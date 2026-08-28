import json
import os

with open('data/names_master.json', 'r', encoding='utf-8') as f:
    master = json.load(f)

first_names = master['first_names']
last_names = master['last_names']

with open('data/first_names.json', 'w', encoding='utf-8') as f:
    json.dump(first_names, f, indent=2)

with open('data/last_names.json', 'w', encoding='utf-8') as f:
    json.dump(last_names, f, indent=2)

print(f"Created data/first_names.json with {len(first_names)} first names.")
print(f"Created data/last_names.json with {len(last_names)} last names.")
