const ergon = require('../services/ergon');
const { loadAllSync } = require('../services/persistence');

function run() {
  console.log('Creating a payment token...');
  const t = ergon.createPayment();
  console.log('Token:', t);

  console.log('\nCreating a reusable token via PoW (fast demo attempt)');
  const challenge = ergon.generatePowChallenge(8); // low difficulty for demo
  let nonce = null;
  // brute force lightly
  for (let i = 0; i < 200000; i++) {
    const n = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36) + i.toString();
    if (ergon.verifyPow(challenge, n)) { nonce = n; break; }
  }
  if (nonce) {
    const rtoken = ergon.mintReusableTokenFromPow(challenge, nonce);
    console.log('Reusable token:', rtoken);
  } else {
    console.log('Could not solve PoW quickly; skipping reusable token');
  }

  console.log('\nState file:');
  console.log(JSON.stringify(loadAllSync(), null, 2));
}

run();
