import urllib.request
import json

print("Calling http://localhost:3000/api/razorpay/sync ...")
req = urllib.request.Request('http://localhost:3000/api/razorpay/sync')
with urllib.request.urlopen(req, timeout=15) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("Success:", data.get('success'))
    raw = data.get('rawCounts', {})
    print(f"Raw Counts from Razorpay API:")
    print(f"  - Payment Links: {raw.get('paymentLinks')}")
    print(f"  - Invoices     : {raw.get('invoices')}")
    print(f"  - Orders       : {raw.get('orders')}")
    print(f"  - Payments     : {raw.get('payments')}")
    print(f"  - Customers    : {raw.get('customers')}")
    
    transformed = data.get('transformed', {})
    cases = transformed.get('cases', [])
    print(f"\nTotal Transformed Cases: {len(cases)}")
    for c in cases[:5]:
        print(f"  • Case: {c.get('id')} | Customer: {c.get('customerName')} | ₹{c.get('amount'):,} | Link: {c.get('paymentLinkUrl')}")
