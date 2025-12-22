import random
print('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">')
print('  <rect width="100%" height="100%" fill="black"/>')
for _ in range(200):
    cx = random.randint(0, 800)
    cy = random.randint(0, 600)
    print(f'  <circle cx="{cx}" cy="{cy}" r="1" fill="white"/>')
print('</svg>')