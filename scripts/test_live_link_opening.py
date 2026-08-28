import urllib.request
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

print("1. Creating a live case via /api/simulate/traffic...")
req = urllib.request.Request(
    'http://localhost:3000/api/simulate/traffic',
    data=json.dumps({}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    c = data.get('case', {})
    link_url = c.get('paymentLinkUrl')
    print(f"Case ID         : {c.get('id')}")
    print(f"Customer Name   : {c.get('customerName')}")
    print(f"Amount          : ₹{c.get('amount'):,}")
    print(f"Payment Link URL: {link_url}")

print("\n2. Testing Payment Link (Opening it)...")
req2 = urllib.request.Request(link_url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req2, timeout=10) as resp2:
        print(f"✅ Link opened successfully! HTTP Status: {resp2.status}")
        print(f"Final URL: {resp2.geturl()}")
        content_preview = resp2.read().decode('utf-8', errors='ignore')[:250]
        print(f"Page Preview: {content_preview.strip()}")
except Exception as e:
    print(f"❌ Failed to open link: {e}")
