import namesData from '../../data/names_master.json';

export interface GeneratedCustomer {
  id: string;
  firstName: string;
  lastName: string;
  customerName: string;
  email: string;
  amount: number;
  currency: string;
  status: 'active' | 'pending' | 'overdue' | 'recovered' | 'in_progress';
}

export interface CustomerGeneratorOptions {
  count?: number;
  maxAmount?: number;
  minAmount?: number;
  step?: number;
}

/**
 * Generates unique customers from 2,500 First Names and 2,500 Last Names
 * Total possible combinations = 6,250,000
 * Price / Amount: Multiples of 10 up to 10,00,000 (10 Lakhs)
 * Email: <firstname><lastname>@gmail.com
 */
export function generateCustomers(options: CustomerGeneratorOptions = {}): GeneratedCustomer[] {
  const {
    count = 5000,
    maxAmount = 1000000,
    minAmount = 10,
    step = 10
  } = options;

  const firstNames = namesData.first_names;
  const lastNames = namesData.last_names;
  const totalCombinations = firstNames.length * lastNames.length;

  if (count > totalCombinations) {
    throw new Error(`Requested count (${count}) exceeds maximum unique combinations (${totalCombinations}).`);
  }

  const usedPairs = new Set<string>();
  const customers: GeneratedCustomer[] = [];

  const minSteps = Math.max(1, Math.floor(minAmount / step));
  const maxSteps = Math.floor(maxAmount / step);
  const statuses: GeneratedCustomer['status'][] = ['active', 'pending', 'overdue', 'recovered', 'in_progress'];

  while (customers.length < count) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const pairKey = `${fn}:${ln}`;

    if (usedPairs.has(pairKey)) {
      continue;
    }
    usedPairs.add(pairKey);

    // Random multiple of 10 up to 10,00,000 (maxAmount)
    const randomStep = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
    const amount = randomStep * step;

    // Email format: <firstname><lastname>@gmail.com
    const email = `${fn.toLowerCase()}${ln.toLowerCase()}@gmail.com`;
    const customerName = `${fn} ${ln}`;
    const id = `CUST-${String(customers.length + 1).padStart(6, '0')}`;
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    customers.push({
      id,
      firstName: fn,
      lastName: ln,
      customerName,
      email,
      amount,
      currency: 'INR',
      status
    });
  }

  return customers;
}

export default generateCustomers;
