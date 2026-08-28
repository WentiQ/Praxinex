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

req = urllib.request.Request('https://api.razorpay.com/v1/invoices?count=10', headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    invoices = data.get('invoices', [])
    print(f"Total invoices fetched: {len(invoices)}")
    for inv in invoices:
        print(f"ID: {inv.get('id')} | Number: {inv.get('invoice_number')} | Status: {inv.get('status')} | Amount: {inv.get('amount')/100} | URL: {inv.get('short_url')}")
