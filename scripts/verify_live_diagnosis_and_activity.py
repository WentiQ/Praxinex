import urllib.request
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

print("Testing End-to-End Autonomous AI Diagnosis & Real-time Activity Tracking...\n")

# 1. Trigger simulated live case
req = urllib.request.Request(
    'http://localhost:3000/api/simulate/traffic',
    data=json.dumps({}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    c = data.get('case', {})
    case_id = c.get('id')
    print(f"=== Generated Case: {case_id} ===")
    print(f"Customer Name     : {c.get('customerName')}")
    print(f"Customer Email    : {c.get('customerEmail')}")
    print(f"Amount (INR)      : ₹{c.get('amount'):,}")
    print(f"Issue Type        : {c.get('issue')}")
    print(f"Recommended Action: {c.get('recommendedAction')}")
    print(f"Recovery Prob     : {c.get('recoveryProbability')}%")
    print(f"AI Reasoning      : {c.get('aiWhy')}")
    print(f"AI Policy Note    : {c.get('aiPolicyNote')}")
    print("\nCase Timeline Events:")
    for step in c.get('timeline', []):
        print(f"  • [{step.get('type')}] {step.get('title')}: {step.get('description')}")

# 2. Check that the activity was ingested into Agent Activity in real time
print("\n=== Checking /api/activities Real-Time Log ===")
req2 = urllib.request.Request('http://localhost:3000/api/activities')
with urllib.request.urlopen(req2, timeout=10) as resp2:
    acts = json.loads(resp2.read().decode('utf-8')).get('activities', [])
    print(f"Total Activities in Log: {len(acts)}")
    for a in acts[:4]:
        print(f"  • [{a.get('timeDisplay')}] {a.get('eventTitle')} | Case: {a.get('caseId')} | {a.get('customerName')} (₹{a.get('amount'):,})")
        print(f"    Decision: {a.get('decision')} | Reason: {a.get('reason')}")
        print(f"    Result: {a.get('result')}")

# 3. Test Direct Case Inspection for this case
print(f"\n=== Testing Inspect Case for {case_id} ===")
req3 = urllib.request.Request('http://localhost:3000/api/cases')
with urllib.request.urlopen(req3, timeout=10) as resp3:
    all_cases = json.loads(resp3.read().decode('utf-8')).get('cases', [])
    matching = [x for x in all_cases if x.get('id') == case_id]
    if matching:
        print(f"✅ Inspection Successful! Case {case_id} retrieved with {len(matching[0].get('timeline', []))} timeline steps and full AI diagnosis.")
    else:
        print(f"❌ Case {case_id} not found in /api/cases")
