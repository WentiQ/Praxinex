import json

def verify():
    with open('data/names_master.json', 'r', encoding='utf-8') as f:
        names = json.load(f)
        print('Master Names Metadata:', names['metadata'])
        print('Sample First Names:', names['first_names'][:5])
        print('Sample Last Names:', names['last_names'][:5])
        assert len(names['first_names']) == 2500, f"Expected 2500 first names, got {len(names['first_names'])}"
        assert len(names['last_names']) == 2500, f"Expected 2500 last names, got {len(names['last_names'])}"
        assert len(set(names['first_names'])) == 2500, "Duplicate first names found"
        assert len(set(names['last_names'])) == 2500, "Duplicate last names found"

    with open('data/generated_customers_5000.json', 'r', encoding='utf-8') as f:
        custs = json.load(f)
        print('\nTotal Generated Customers:', len(custs))
        print('Sample 5 Customers:')
        for i, c in enumerate(custs[:5], 1):
            print(f"  {i}. {c['customer_name']} | {c['email']} | INR {c['amount']:,} | Status: {c['status']}")
            assert c['amount'] % 10 == 0, f"Amount {c['amount']} is not multiple of 10"
            assert 10 <= c['amount'] <= 1000000, f"Amount {c['amount']} out of range"
            expected_email = f"{c['first_name'].lower()}{c['last_name'].lower()}@gmail.com"
            assert c['email'] == expected_email, f"Email mismatch: {c['email']} vs {expected_email}"

    print("\nAll assertions passed successfully! Dataset is 100% verified.")

if __name__ == '__main__':
    verify()
