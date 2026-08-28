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

req = urllib.request.Request('https://api.razorpay.com/v1/payment_links?count=50', headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    links = data.get('payment_links', [])
    print(f"Total links fetched: {len(links)}")
    for l in links:
        print(f"ID: {l.get('id')} | Status: {l.get('status')} | Amount: {l.get('amount')/100} | URL: {l.get('short_url')}")
