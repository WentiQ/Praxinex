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

inv_payload = json.dumps({
    'type': 'invoice',
    'description': 'AI Recovery Test Invoice',
    'customer': {
        'name': 'Dinesh Polavarapu',
        'email': 'dineshpolavarapu66@gmail.com',
        'contact': '+917032983348'
    },
    'line_items': [{
        'name': 'Monthly SaaS Recovery',
        'amount': 75000,
        'currency': 'INR',
        'quantity': 1
    }]
}).encode('utf-8')

req = urllib.request.Request('https://api.razorpay.com/v1/invoices', data=inv_payload, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Created Invoice on Razorpay:")
        print("ID       :", data.get('id'))
        print("Number   :", data.get('invoice_number'))
        print("Status   :", data.get('status'))
        print("Short URL:", data.get('short_url'))
        print("URL      :", data.get('url'))
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode('utf-8')}")
