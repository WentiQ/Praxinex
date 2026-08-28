import urllib.request
import base64
import json

key_id = 'rzp_test_TSolTvUZ0mStxn'
key_secret = 'jJtOV3iYoa1XPuuSDVj76nwc'

auth_str = f"{key_id}:{key_secret}"
b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

headers = {
    'Authorization': f'Basic {b64_auth}',
    'Content-Type': 'application/json'
}

print("1. Testing GET /v1/payment_links ...")
try:
    req = urllib.request.Request('https://api.razorpay.com/v1/payment_links?count=5', headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"Total existing links: {data.get('count')}")
        for item in data.get('payment_links', [])[:3]:
            print(f"  - ID: {item.get('id')}, Status: {item.get('status')}, URL: {item.get('short_url')}, Amount: {item.get('amount')/100}")
except Exception as e:
    print("GET payment_links failed:", e)

print("\n2. Testing POST /v1/orders ...")
try:
    order_payload = json.dumps({
        'amount': 50000,
        'currency': 'INR',
        'receipt': 'rcpt_test_123',
        'notes': {'caseId': 'RC-101'}
    }).encode('utf-8')
    req = urllib.request.Request('https://api.razorpay.com/v1/orders', data=order_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"Created Order: {data.get('id')}, Status: {data.get('status')}, Amount: {data.get('amount')/100}")
except Exception as e:
    print("POST orders failed:", e)

print("\n3. Testing POST /v1/invoices ...")
try:
    inv_payload = json.dumps({
        'type': 'invoice',
        'description': 'AI Recovery Invoice',
        'customer': {
            'name': 'Test Customer',
            'email': 'test@gmail.com',
            'contact': '+917032983348'
        },
        'line_items': [{
            'name': 'Subscription Recovery',
            'amount': 50000,
            'currency': 'INR',
            'quantity': 1
        }]
    }).encode('utf-8')
    req = urllib.request.Request('https://api.razorpay.com/v1/invoices', data=inv_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"Created Invoice: {data.get('id')}, Status: {data.get('status')}, Short URL: {data.get('short_url')}")
except Exception as e:
    print("POST invoices failed:", e)
