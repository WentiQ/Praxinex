import urllib.request
import json
import re
import random
import csv
import os

# Indian names list to enrich dataset
INDIAN_FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Muhammad", "Sai", "Arnav", "Ayaan",
    "Krishna", "Ishaan", "Shaurya", "Atharva", "Advik", "Pranav", "Advaith", "Aaryan", "Dhruv", "Kabir",
    "Ritvik", "Darsh", "Kian", "Samar", "Vedant", "Devansh", "Rudra", "Ayush", "Tanmay", "Parth",
    "Aarush", "Harsh", "Laksh", "Dev", "Siddharth", "Shivam", "Om", "Madhav", "Yash", "Raghav",
    "Ananya", "Diya", "Aadhya", "Pari", "Saanvi", "Navya", "Angel", "Myra", "Avni", "Sara",
    "Ira", "Riya", "Ahana", "Anvi", "Prisha", "Rhea", "Aditi", "Isha", "Kavya", "Khushi",
    "Anaya", "Shanaya", "Pihu", "Kiara", "Tanvi", "Vaidehi", "Meera", "Mahi", "Divya", "Sia",
    "Rajesh", "Suresh", "Ramesh", "Dinesh", "Mahesh", "Mukesh", "Naresh", "Sunil", "Anil", "Sanjay",
    "Vijay", "Ajay", "Vikram", "Sunita", "Anita", "Geeta", "Seema", "Rekha", "Pooja", "Neeta",
    "Amit", "Sumit", "Rohit", "Mohit", "Rahul", "Naveen", "Praveen", "Deepak", "Manoj", "Alok",
    "Pankaj", "Vikas", "Vishal", "Gaurav", "Saurabh", "Abhishek", "Ashish", "Manish", "Sachin", "Nitish",
    "Neha", "Swati", "Shweta", "Sneha", "Kiran", "Meenakshi", "Shalini", "Rashmi", "Deepa", "Anjali"
]

INDIAN_LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Malhotra", "Bhatia", "Saxena", "Mehta", "Chopra", "Kapoor", "Agarwal",
    "Patel", "Shah", "Deshmukh", "Kulkarni", "Joshi", "Patil", "Pawar", "Shinde", "Gaikwad", "More",
    "Reddy", "Rao", "Nair", "Menon", "Pillai", "Iyer", "Iyengar", "Shetty", "Hegde", "Gowda",
    "Singh", "Kaur", "Gill", "Dhillon", "Sandhu", "Sidhu", "Grewal", "Mann", "Brar", "Bains",
    "Chatterjee", "Mukherjee", "Banerjee", "Bose", "Dutta", "Ghosh", "Sen", "Roy", "Das", "Chakraborty",
    "Mishra", "Pandey", "Tiwari", "Dubey", "Shukla", "Tripathi", "Pathak", "Chaubey", "Upadhyay", "Dwivedi",
    "Kumar", "Prasad", "Yadav", "Chauhan", "Thakur", "Sinha", "Srivastava", "Rawat", "Bisht", "Negi",
    "Jain", "Bhandari", "Kothari", "Surana", "Singhal", "Garg", "Bansal", "Goel", "Mittal", "Kansal"
]

def fetch_and_clean():
    first_names_url = 'https://raw.githubusercontent.com/dominictarr/random-name/master/first-names.json'
    last_names_url = 'https://raw.githubusercontent.com/dominictarr/random-name/master/names.json'

    print("Fetching raw names dataset...")
    req1 = urllib.request.Request(first_names_url, headers={'User-Agent': 'Mozilla/5.0'})
    req2 = urllib.request.Request(last_names_url, headers={'User-Agent': 'Mozilla/5.0'})

    with urllib.request.urlopen(req1) as r1:
        fn_raw = json.loads(r1.read().decode('utf-8'))

    with urllib.request.urlopen(req2) as r2:
        ln_raw = json.loads(r2.read().decode('utf-8'))

    # Clean and collect first names
    first_names_set = set()
    first_names_list = []

    # Add curated Indian first names first
    for name in INDIAN_FIRST_NAMES:
        formatted = name.strip().capitalize()
        if formatted.lower() not in first_names_set:
            first_names_set.add(formatted.lower())
            first_names_list.append(formatted)

    for name in fn_raw:
        n = name.strip()
        if re.match(r'^[A-Za-z]+$', n) and 2 <= len(n) <= 15:
            formatted = n.capitalize()
            if formatted.lower() not in first_names_set:
                first_names_set.add(formatted.lower())
                first_names_list.append(formatted)

    # Clean and collect last names
    last_names_set = set()
    last_names_list = []

    # Add curated Indian last names first
    for name in INDIAN_LAST_NAMES:
        formatted = name.strip().capitalize()
        if formatted.lower() not in last_names_set:
            last_names_set.add(formatted.lower())
            last_names_list.append(formatted)

    for name in ln_raw:
        n = name.strip()
        if re.match(r'^[A-Za-z]+$', n) and 2 <= len(n) <= 15:
            formatted = n.capitalize()
            if formatted.lower() not in last_names_set:
                last_names_set.add(formatted.lower())
                last_names_list.append(formatted)

    print(f"Total available First Names: {len(first_names_list)}")
    print(f"Total available Last Names: {len(last_names_list)}")

    # Slice exactly 2500 unique first names and 2500 unique last names
    final_first_names = sorted(first_names_list[:2500])
    final_last_names = sorted(last_names_list[:2500])

    print(f"Selected exactly {len(final_first_names)} First Names")
    print(f"Selected exactly {len(final_last_names)} Last Names")
    print(f"Total unique name combinations possible: {len(final_first_names) * len(final_last_names):,}")

    os.makedirs('data', exist_ok=True)

    # 1. Save Master Names JSON
    master_data = {
        "metadata": {
            "total_first_names": len(final_first_names),
            "total_last_names": len(final_last_names),
            "total_unique_combinations": len(final_first_names) * len(final_last_names),
            "description": "2,500 unique First Names and 2,500 unique Last Names allowing 6.25 million unique customer combinations."
        },
        "first_names": final_first_names,
        "last_names": final_last_names
    }

    with open('data/names_master.json', 'w', encoding='utf-8') as f:
        json.dump(master_data, f, indent=2)

    with open('data/first_names.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(final_first_names))

    with open('data/last_names.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(final_last_names))

    print("Saved data/names_master.json, data/first_names.txt, data/last_names.txt")

    return final_first_names, final_last_names

def generate_sample_customers(first_names, last_names, count=5000):
    print(f"Generating {count} sample customers...")
    used_combinations = set()
    customers = []

    # Multiples of 10 up to 10,00,000 (1,000,000)
    # Range: 10, 20, 30, ... 1,000,000
    min_val = 10
    max_val = 1000000

    random.seed(42) # For reproducible clean sample

    while len(customers) < count:
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        combo = (fn, ln)
        
        if combo in used_combinations:
            continue
        used_combinations.add(combo)

        # Random multiple of 10 up to 10,00,000
        # step of 10
        amount = random.randint(1, max_val // 10) * 10
        
        # Email format: <firstname><lastname>@gmail.com
        email = f"{fn.lower()}{ln.lower()}@gmail.com"
        customer_name = f"{fn} {ln}"
        customer_id = f"CUST-{len(customers) + 1:05d}"

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

    # Save to JSON
    with open('data/generated_customers_5000.json', 'w', encoding='utf-8') as f:
        json.dump(customers, f, indent=2)

    # Save to CSV
    with open('data/generated_customers_5000.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["id", "first_name", "last_name", "customer_name", "email", "amount", "currency", "status"])
        writer.writeheader()
        writer.writerows(customers)

    print(f"Successfully generated {len(customers)} customers:")
    print(f" - JSON: data/generated_customers_5000.json")
    print(f" - CSV:  data/generated_customers_5000.csv")
    print(f"Sample customer: {customers[0]}")

if __name__ == '__main__':
    fn, ln = fetch_and_clean()
    generate_sample_customers(fn, ln, 5000)
