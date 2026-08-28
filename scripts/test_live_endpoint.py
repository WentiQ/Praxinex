import urllib.request
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

print("Testing http://localhost:3000/api/simulate/traffic (Option 1 / First Block: Quick Generate)...\n")

for i in range(3):
    req = urllib.request.Request(
        'http://localhost:3000/api/simulate/traffic',
        data=json.dumps({}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        c = data.get('case', {})
        print(f"=== [Test Click {i+1}] ===")
        print("Customer Name :", c.get('customerName'))
        print("Customer Email:", c.get('customerEmail'))
        print("Amount (INR)  : ₹", f"{c.get('amount'):,}", f"(Multiple of 10: {c.get('amount') % 10 == 0})")
        print("Issue         :", c.get('issue'))
        print("Payment Link  :", c.get('paymentLinkUrl'))
        print("Timeline Events:")
        for step in c.get('timeline', []):
            print(f"  • {step.get('title')}: {step.get('description')}")
        print()
