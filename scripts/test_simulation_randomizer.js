import fs from 'fs';

const fn = JSON.parse(fs.readFileSync('data/first_names.json', 'utf8'));
const ln = JSON.parse(fs.readFileSync('data/last_names.json', 'utf8'));

console.log(`Loaded ${fn.length} First Names and ${ln.length} Last Names`);

for (let i = 0; i < 5; i++) {
  const f = fn[Math.floor(Math.random() * fn.length)];
  const l = ln[Math.floor(Math.random() * ln.length)];
  const email = `${f.toLowerCase()}${l.toLowerCase()}@gmail.com`;
  const amount = Math.floor(Math.random() * 100000) * 10;
  console.log(`[Case ${i + 1}] ${f} ${l} | ${email} | ₹${amount.toLocaleString('en-IN')} (Multiple of 10: ${amount % 10 === 0})`);
}
