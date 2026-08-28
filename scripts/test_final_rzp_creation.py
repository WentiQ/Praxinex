import urllib.request
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

print("1. Creating a live case on localhost:3000...")
req = urllib.request.Request(
    'http://localhost:3000/api/simulate/traffic',
    data=json.dumps({}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    c = data.get('case', {})
    print(f"Generated Case ID  : {c.get('id')}")
    print(f"Customer Name      : {c.get('customerName')}")
    print(f"Customer Email     : {c.get('customerEmail')}")
    print(f"Amount (INR)       : ₹{c.get('amount'):,}")
    print(f"Razorpay Entity ID : {c.get('razorpayPaymentId')}")
    print(f"Payment Link URL   : {c.get('paymentLinkUrl')}")
