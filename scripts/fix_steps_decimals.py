import os
import re

def fix_steps(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                new_content = re.sub(r'step="0\.1"', 'step="any"', new_content)
                new_content = re.sub(r'step="0\.01"', 'step="any"', new_content)
                new_content = re.sub(r'step="0\.5"', 'step="any"', new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed steps in {path}")

fix_steps('app')
