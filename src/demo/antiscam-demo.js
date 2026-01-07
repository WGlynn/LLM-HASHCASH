const ergon = require('../services/ergon');
const { loadAllSync } = require('../services/persistence');

async function solvePow(challenge, maxTries = 200000) {
  for (let i = 0; i < maxTries; i++) {
    const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36) + i.toString();
    if (ergon.verifyPow(challenge, nonce)) return nonce;
    if (i % 50000 === 0 && i > 0) await new Promise(r => setTimeout(r,0));
  }
  return null;
}

async function runDemo() {
  const trusted = new Set(['friend-123']);

  const messages = [
    { sender: 'friend-123', text: 'Hey, long time no see — lunch?' },
    { sender: 'unknown-1', text: 'You won an airdrop! Click here to claim' },
    { sender: 'recruiter-42', text: 'We have a job opening you might like' },
  ];

  for (const m of messages) {
    console.log(`\nIncoming from ${m.sender}: ${m.text}`);
    if (trusted.has(m.sender)) {
      console.log('Directly accepted:', m.text.length > 200 ? m.text.slice(0,197)+'...' : m.text);
      continue;
    }

    const suspiciousKeywords = ['free','investment','giveaway','work from home','urgent','win','airdrop','click','verify account','transfer'];
    const suspicious = suspiciousKeywords.some(k => m.text.toLowerCase().includes(k));
    const difficulty = suspicious ? 18 : 12;
    const challenge = ergon.generatePowChallenge(difficulty);
    console.log('Issued PoW challenge', challenge);
    const nonce = await solvePow(challenge, 200000);
    if (nonce) {
      console.log('Found nonce, minting reusable token...');
      const token = ergon.mintReusableTokenFromPow(challenge, nonce);
      console.log('Reusable token minted (demo):', token);
      continue;
    }
    console.log('Fallback: require payment (demo).');
    const token = ergon.createPayment();
    console.log('Payment token created (demo):', token);
  }

  console.log('\nPersisted state file content:');
  console.log(JSON.stringify(loadAllSync(), null, 2));
}

runDemo().then(()=>console.log('Demo finished.'), e=>console.error(e));
