#!/usr/bin/env python3
"""
Praxinex AI Revenue Recovery Agent - Customer Payment Lifecycle Tracker
1. Loads 2 datasets: data/first_names.json (2,500) and data/last_names.json (2,500).
2. Randomly selects 1 first name and 1 last name to create the customer.
3. Forms email as <firstname><lastname>@gmail.com.
4. Generates random amount in multiples of 10 up to 10,00,000 (10 Lakhs).
5. Tracks normal Payment Link / Invoice Lifecycle from generation on Razorpay to Payment Done!
"""

import json
import random
import os
import uuid
import sys
from datetime import datetime, timezone

# Ensure UTF-8 output on Windows consoles
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

FIRST_NAMES_FILE = os.path.join(DATA_DIR, 'first_names.json')
LAST_NAMES_FILE = os.path.join(DATA_DIR, 'last_names.json')

def load_name_datasets():
    with open(FIRST_NAMES_FILE, 'r', encoding='utf-8') as f:
        first_names = json.load(f)
    with open(LAST_NAMES_FILE, 'r', encoding='utf-8') as f:
        last_names = json.load(f)
    return first_names, last_names

def generate_random_amount(max_amount=1000000, step=10):
    max_steps = max_amount // step
    return random.randint(1, max_steps) * step

def create_customer_and_track_payment(is_invoice=False):
    first_names, last_names = load_name_datasets()
    
    # 1. Pick 1 random first name and 1 random last name
    fn = random.choice(first_names)
    ln = random.choice(last_names)
    customer_name = f"{fn} {ln}"
    
    # 2. Form email: <firstname><lastname>@gmail.com
    email = f"{fn.lower()}{ln.lower()}@gmail.com"
    
    # 3. Random amount: multiples of 10 only up to 10,00,000 (10 Lakhs max)
    amount = generate_random_amount(max_amount=1000000, step=10)
    
    # 4. Generate Payment Link / Invoice on Razorpay
    uid = uuid.uuid4().hex[:8]
    payment_link_id = f"plink_{uid}"
    payment_link_url = f"https://rzp.io/rzp/pay_{uid}"
    invoice_number = f"INV-{random.randint(1000, 9999)}" if is_invoice else None
    created_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    print("\n" + "="*70)
    print(f">> NEW {'INVOICE' if is_invoice else 'PAYMENT LINK'} GENERATED ON RAZORPAY")
    print("="*70)
    print(f"Customer Name : {customer_name}")
    print(f"Customer Email: {email}")
    print(f"Total Amount  : INR {amount:,} (Multiple of 10: {amount % 10 == 0})")
    if is_invoice:
        print(f"Invoice Number: {invoice_number}")
    print(f"Payment Link  : {payment_link_url} (ID: {payment_link_id})")
    print(f"Created At    : {created_at}")
    print("="*70)

    # 5. Timeline Tracking from Link Generated to Payment Done
    timeline = []
    
    # Stage 1: Generated on Razorpay
    step1 = {
        "step": 1,
        "stage": "INVOICE_ISSUED" if is_invoice else "PAYMENT_LINK_GENERATED",
        "title": f"Invoice ({invoice_number}) Issued on Razorpay" if is_invoice else "Payment Link Generated on Razorpay",
        "description": f"Invoice ({invoice_number}) generated for INR {amount:,}." if is_invoice else f"Payment link ({payment_link_id}) generated on Razorpay for INR {amount:,}.",
        "payment_link_url": payment_link_url
    }
    timeline.append(step1)
    print(f"\n[STAGE 1] -> {step1['stage']}: {step1['title']}")
    print(f"  Details: {step1['description']}")

    # Stage 2: Awaiting Payment / Overdue
    step2 = {
        "step": 2,
        "stage": "INVOICE_OVERDUE" if is_invoice else "AWAITING_PAYMENT",
        "title": "Invoice Overdue / Settlement Pending" if is_invoice else "Payment Link Delivered - Awaiting Payment",
        "description": f"Invoice settlement window elapsed for INR {amount:,}." if is_invoice else f"Payment link active and delivered to {email}. Awaiting authorization.",
    }
    timeline.append(step2)
    print(f"\n[STAGE 2] -> {step2['stage']}: {step2['title']}")
    print(f"  Details: {step2['description']}")

    # Stage 3: Recovery Follow-up Link Active
    step3 = {
        "step": 3,
        "stage": "RECOVERY_LINK_ACTIVE",
        "title": "Payment Link Active for Settlement",
        "description": f"Razorpay payment link ({payment_link_id}: {payment_link_url}) sent to {email}. Tracking payment status.",
    }
    timeline.append(step3)
    print(f"\n[STAGE 3] -> {step3['stage']}: {step3['title']}")
    print(f"  Details: {step3['description']}")

    # Stage 4: Payment Done
    settled_payment_id = f"pay_{uuid.uuid4().hex[:12].upper()}"
    step4 = {
        "step": 4,
        "stage": "PAYMENT_DONE",
        "title": "Payment Captured & Settled via Razorpay",
        "description": f"INR {amount:,} captured successfully via {settled_payment_id}. Tracking closed.",
        "settled_payment_id": settled_payment_id
    }
    timeline.append(step4)
    print(f"\n[STAGE 4] -> {step4['stage']}: {step4['title']}")
    print(f"  Details: {step4['description']}")
    print(f"  Settled Pay ID: {settled_payment_id}")
    print("="*70 + "\n")

    return {
        "customer_name": customer_name,
        "first_name": fn,
        "last_name": ln,
        "email": email,
        "amount": amount,
        "is_invoice": is_invoice,
        "invoice_number": invoice_number,
        "payment_link": payment_link_url,
        "payment_link_id": payment_link_id,
        "status": "PAYMENT_DONE",
        "settled_payment_id": settled_payment_id,
        "timeline": timeline
    }

if __name__ == '__main__':
    print("\n--- Simulating Payment Link Lifecycle ---")
    create_customer_and_track_payment(is_invoice=False)
    
    print("\n--- Simulating Invoice Settlement Lifecycle ---")
    create_customer_and_track_payment(is_invoice=True)
