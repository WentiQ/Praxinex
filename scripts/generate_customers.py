#!/usr/bin/env python3
"""
Praxinex AI Revenue Recovery Agent - Dynamic Customer Generator
Generates realistic unique customer records using 2,500 First Names and 2,500 Last Names
Combinations: 2,500 x 2,500 = 6,250,000 unique customers.
Email format: <firstname><lastname>@gmail.com
Price / Amount: Multiples of 10 up to 10,00,000 (10 Lakhs).
"""

import os
import json
import random
import csv
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')
MASTER_NAMES_FILE = os.path.join(DATA_DIR, 'names_master.json')

def load_names():
    if not os.path.exists(MASTER_NAMES_FILE):
        raise FileNotFoundError(f"Master names file not found at {MASTER_NAMES_FILE}. Run scripts/build_name_datasets.py first.")
    
    with open(MASTER_NAMES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data['first_names'], data['last_names']

def generate_customers(count=5000, max_amount=1000000, min_amount=10, step=10, seed=None):
    if seed is not None:
        random.seed(seed)

    first_names, last_names = load_names()
    total_possible = len(first_names) * len(last_names)
    
    if count > total_possible:
        raise ValueError(f"Requested count ({count}) exceeds maximum unique combinations ({total_possible}).")

    used_combinations = set()
    customers = []
    
    max_steps = max_amount // step
    min_steps = max(1, min_amount // step)

    while len(customers) < count:
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        combo = (fn, ln)
        
        if combo in used_combinations:
            continue
        used_combinations.add(combo)

        # Multiples of 10 only up to max_amount (10,00,000)
        amount = random.randint(min_steps, max_steps) * step
        
        # Email format: <firstname><lastname>@gmail.com
        email = f"{fn.lower()}{ln.lower()}@gmail.com"
        customer_name = f"{fn} {ln}"
        customer_id = f"CUST-{len(customers) + 1:06d}"

        customers.append({
            "id": customer_id,
            "first_name": fn,
            "last_name": ln,
            "customer_name": customer_name,
            "email": email,
            "amount": amount,
            "currency": "INR",
            "status": random.choice(["active", "pending", "overdue", "recovered", "in_progress"])
        })

    return customers

def main():
    parser = argparse.ArgumentParser(description="Generate unique customer dataset.")
    parser.add_argument("--count", "-n", type=int, default=5000, help="Number of unique customers to generate (default: 5000)")
    parser.add_argument("--max-amount", type=int, default=1000000, help="Maximum amount (default: 1000000, 10 Lakhs)")
    parser.add_argument("--format", choices=["json", "csv", "sql", "all"], default="all", help="Output format (default: all)")
    parser.add_argument("--output-prefix", type=str, default="generated_customers", help="Output filename prefix")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    
    args = parser.parse_args()

    print(f"Generating {args.count:,} unique customers...")
    customers = generate_customers(
        count=args.count,
        max_amount=args.max_amount,
        seed=args.seed
    )

    os.makedirs(DATA_DIR, exist_ok=True)

    if args.format in ["json", "all"]:
        json_path = os.path.join(DATA_DIR, f"{args.output_prefix}_{args.count}.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(customers, f, indent=2)
        print(f"Exported JSON: {json_path}")

    if args.format in ["csv", "all"]:
        csv_path = os.path.join(DATA_DIR, f"{args.output_prefix}_{args.count}.csv")
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=["id", "first_name", "last_name", "customer_name", "email", "amount", "currency", "status"])
            writer.writeheader()
            writer.writerows(customers)
        print(f"Exported CSV:  {csv_path}")

    if args.format in ["sql", "all"]:
        sql_path = os.path.join(DATA_DIR, f"{args.output_prefix}_{args.count}.sql")
        with open(sql_path, 'w', encoding='utf-8') as f:
            f.write("-- Praxinex Generated Customers SQL Seed\n")
            for c in customers:
                clean_name = c['customer_name'].replace("'", "''")
                clean_email = c['email'].replace("'", "''")
                f.write(f"INSERT INTO recovery_cases (id, customer_name, amount, status, case_data) VALUES ('{c['id']}', '{clean_name}', {c['amount']}, '{c['status']}', '{json.dumps(c)}');\n")
        print(f"Exported SQL:  {sql_path}")

    print(f"\nDone! Successfully created {len(customers):,} unique customers.")

if __name__ == '__main__':
    main()
