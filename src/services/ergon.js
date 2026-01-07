const crypto = require('crypto');
const { loadAllSync, saveAllSync } = require('./persistence');

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function leadingZeroBits(hex) {
  let bits = 0;
  for (const ch of hex) {
    const val = parseInt(ch, 16);
    for (let b = 3; b >= 0; b--) {
      if (((val >> b) & 1) === 0) bits++;
      else return bits;
    }
  }
  return bits;
}

function generatePowChallenge(difficulty = 16) {
  return { id: crypto.randomBytes(8).toString('hex'), prefix: crypto.randomBytes(8).toString('hex'), difficulty };
}

function verifyPow(challenge, nonce) {
  const h = sha256Hex(challenge.prefix + nonce);
  return leadingZeroBits(h) >= challenge.difficulty;
}

// Reusable token generation (simulated): HMAC(prefix|nonce) with server secret
const SECRET = process.env.ERGON_SECRET || 'ergon-demo-secret';
const tokens = new Set();

// Load persisted tokens
try {
  const st = loadAllSync();
  const p = (st && st.payments) ? st.payments : [];
  if (Array.isArray(p)) p.forEach(function(t) { tokens.add(t); });
} catch (e) {}

function persistTokens() {
  try {
    const st = loadAllSync();
    st.payments = Array.from(tokens);
    saveAllSync(st);
  } catch (e) {}
}

function createPayment(tokenId) {
  var t = tokenId ? tokenId : crypto.randomBytes(8).toString('hex');
  tokens.add(t);
  persistTokens();
  return t;
}

function verifyPayment(token) {
  return tokens.has(token);
}

function mintReusableTokenFromPow(challenge, nonce) {
  if (!verifyPow(challenge, nonce)) return null;
  const raw = `${challenge.prefix}:${nonce}`;
  const h = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
  tokens.add(h);
  persistTokens();
  return h;
}

module.exports = { generatePowChallenge, verifyPow, createPayment, verifyPayment, mintReusableTokenFromPow };
