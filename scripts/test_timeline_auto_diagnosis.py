import urllib.request
import json
import time
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://localhost:3000'

def test_timeline_update_auto_diagnosis():
    print("=== TEST: Automatic AI LLM Diagnosis on Timeline Update ===")
    
    # 1. Health check
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/health")
        with urllib.request.urlopen(req, timeout=5) as res:
            print(f"✓ Server is reachable on {BASE_URL}")
    except Exception as e:
        print(f"⚠️ Server is not running on {BASE_URL}: {e}")
        return

    # 2. Create a test active recovery case with an initial failure timeline
    test_case_id = f"RC-TL-TEST-{int(time.time())}"
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    initial_case = {
        "id": test_case_id,
        "customerName": "Rohan Deshmukh",
        "customerEmail": "rohan.deshmukh@enterprise.in",
        "customerPhone": "+91 98200 12345",
        "amount": 24500,
        "issue": "Payment failed",
        "failureReason": "Issuer switch timed out during 3D Secure verification",
        "failureCode": "GATEWAY_TIMEOUT",
        "status": "In progress",
        "attemptCount": 1,
        "maxAttempts": 3,
        "timeline": [
            {
                "id": f"t-init-{int(time.time())}",
                "timestamp": now_iso,
                "timeDisplay": "10:15 AM",
                "title": "Payment Authorization Failed",
                "description": "Issuer switch timed out during 3D Secure verification.",
                "type": "failure"
            }
        ]
    }

    print(f"\n1. Submitting test case {test_case_id}...")
    req_post = urllib.request.Request(
        f"{BASE_URL}/api/cases",
        data=json.dumps(initial_case).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req_post, timeout=10) as res:
        post_resp = json.loads(res.read().decode('utf-8'))
        print(f"✓ Case created successfully.")

    # Wait 2 seconds for initial processing
    time.sleep(2)

    # 3. Append a new timeline event (non-recovery update, e.g. Customer clicked payment link or Mandate SMS sent)
    print(f"\n2. Appending new timeline update to unrecovered case {test_case_id}...")
    timeline_event = {
        "id": f"t-cust-action-{int(time.time())}",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "timeDisplay": "10:20 AM",
        "title": "Customer opened 1-click recovery payment link",
        "description": "Customer navigated to Razorpay checkout page from SMS notification, but session expired before OTP entry.",
        "type": "action"
    }

    req_tl = urllib.request.Request(
        f"{BASE_URL}/api/cases/{test_case_id}/timeline",
        data=json.dumps(timeline_event).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req_tl, timeout=10) as res:
        tl_resp = json.loads(res.read().decode('utf-8'))
        print(f"✓ Timeline update submitted. Timeline length: {len(tl_resp.get('timeline', []))}")

    # 4. Wait a moment for the sequential FIFO queue to run LLM Diagnosis
    print("\n3. Waiting for automatic AI LLM diagnosis to execute on timeline update...")
    time.sleep(4)

    # 5. Fetch the case and verify that AI Root-Cause Diagnosis is now present in the case and timeline
    req_get = urllib.request.Request(f"{BASE_URL}/api/cases")
    with urllib.request.urlopen(req_get, timeout=10) as res:
        cases_data = json.loads(res.read().decode('utf-8')).get('cases', [])
        target = next((c for c in cases_data if c.get('id') == test_case_id), None)
        
        if not target:
            print(f"❌ Error: Case {test_case_id} not found in store.")
            return

        print(f"\n=== Case Inspection After Timeline Update ===")
        print(f"Case ID           : {target.get('id')}")
        print(f"Status            : {target.get('status')}")
        print(f"Recommended Action: {target.get('recommendedAction')}")
        print(f"Recovery Prob     : {target.get('recoveryProbability')}%")
        print(f"AI Why / Reason   : {target.get('aiWhy')}")
        print(f"Optimal Window    : {target.get('llmDiagnosis', {}).get('optimalTimeWindow') or target.get('recommendedAction')}")

        has_ai_diag_timeline = any(
            t.get('type') == 'diagnosis' or 'AI Root-Cause Diagnosis' in t.get('title', '')
            for t in target.get('timeline', [])
        )
        
        print("\nFull Timeline Steps:")
        for idx, t in enumerate(target.get('timeline', []), 1):
            print(f"  {idx}. [{t.get('type')}] {t.get('title')} — {t.get('description')[:70]}...")

        if has_ai_diag_timeline or target.get('llmDiagnosis'):
            print("\n✅ SUCCESS: AI LLM Diagnosis was automatically executed for the recovery case upon timeline update!")
        else:
            print("\n❌ FAILED: AI Diagnosis was not executed on timeline update.")

if __name__ == '__main__':
    test_timeline_update_auto_diagnosis()
