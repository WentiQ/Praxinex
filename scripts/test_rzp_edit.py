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

# Try updating the first link: plink_TV6AaQlBTghhRA
link_id = 'plink_TV6AaQlBTghhRA'
payload = json.dumps({
    'amount': 35000,
    'description': 'Updated description test'
}).encode('utf-8')

print("1. Trying PATCH /v1/payment_links/" + link_id)
req = urllib.request.Request(f'https://api.razorpay.com/v1/payment_links/{link_id}', data=payload, headers=headers, method='PATCH')
try:
    with urllib.request.urlopen(req) as resp:
        print("PATCH Response:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"PATCH Error {e.code}: {e.read().decode('utf-8')}")

print("\n2. Trying POST /v1/invoices (as payment link type) ...")
inv_payload = json.dumps({
    'type': 'link',
    'amount': 45000,
    'currency': 'INR',
    'description': 'Invoice Link Test',
    'customer': {
        'name': 'Dinesh Test',
        'email': 'dinesh@test.com',
        'contact': '+917032983348'
    }
}).encode('utf-8')
req2 = urllib.request.Request('https://api.razorpay.com/v1/invoices', data=inv_payload, headers=headers)
try:
    with urllib.request.urlopen(req2) as resp2:
        print("Invoice Link Created:", resp2.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"Invoice Error {e.code}: {e.read().decode('utf-8')}")
