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

payload = json.dumps({
    'amount': 25000,
    'currency': 'INR',
    'accept_partial': False,
    'description': 'Test Payment Link for Dinesh',
    'customer': {
        'name': 'Dinesh Test',
        'email': 'dinesh@example.com',
        'contact': '+917032983348'
    },
    'notify': {'sms': False, 'email': False}
}).encode('utf-8')

req = urllib.request.Request('https://api.razorpay.com/v1/payment_links', data=payload, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        print("Success:", resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
