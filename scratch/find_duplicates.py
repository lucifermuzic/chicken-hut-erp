import re
from collections import Counter

file_path = r'c:\Users\Huwiyyaa\Downloads\CHN\nextjs-project-app\app\ceo\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Match function or const component definitions
pattern = r'(?:function|const)\s+([a-zA-Z0-9_]+)\s*(?:=|[:({])'
matches = re.findall(pattern, content)

counts = Counter(matches)
duplicates = {name: count for name, count in counts.items() if count > 1}

# Filter out common keywords that might be caught
keywords = {'if', 'while', 'for', 'switch', 'return', 'let', 'var', 'const', 'function'}
duplicates = {name: count for name, count in duplicates.items() if name not in keywords}

if duplicates:
    print("Duplicate definitions found:")
    for name, count in duplicates.items():
        print(f"{name}: {count} times")
else:
    print("No duplicate definitions found.")
