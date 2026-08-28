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

inv_id = 'inv_TVHTuQ0tsEZyup'
req = urllib.request.Request(f'https://api.razorpay.com/v1/invoices/{inv_id}', headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(">> Verified on Razorpay Account:")
    print("Invoice ID   :", data.get('id'))
    print("Customer Name:", data.get('customer_details', {}).get('name'))
    print("Email        :", data.get('customer_details', {}).get('email'))
    print("Amount (INR) :", data.get('amount') / 100)
    print("Short URL    :", data.get('short_url'))
    print("Status       :", data.get('status'))
