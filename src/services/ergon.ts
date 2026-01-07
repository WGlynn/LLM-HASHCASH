import crypto from "crypto";
import { loadAllSync, saveAllSync } from "./persistence";

// Simple mock of an Ergon-like reusable PoW and payment verification layer.
// This is a proof-of-concept only — not secure production code.

export type PowChallenge = {
  id: string;
  prefix: string;
  difficulty: number; // number of leading zero bits required
};

export function generatePowChallenge(difficulty = 16): PowChallenge {
  const id = crypto.randomBytes(8).toString("hex");
  const prefix = crypto.randomBytes(8).toString("hex");
  return { id, prefix, difficulty };
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function leadingZeroBits(hex: string) {
  // Count leading zero bits in hex string
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

export function verifyPow(challenge: PowChallenge, nonce: string): boolean {
  const h = sha256Hex(challenge.prefix + nonce);
  const zeros = leadingZeroBits(h);
  return zeros >= challenge.difficulty;
}

// For the demo we simulate a payment token check and persist tokens.
const payments = new Set<string>();

// Load persisted payments on startup
try {
  const st = loadAllSync();
  const p = st?.payments ?? [];
  if (Array.isArray(p)) p.forEach((t: string) => payments.add(t));
} catch (e) {
  // ignore
}

function persistPayments() {
  try {
    const st = loadAllSync();
    st.payments = Array.from(payments.values());
    saveAllSync(st);
  } catch (e) {
    // ignore
  }
}

export function createPayment(tokenId?: string) {
  const t = tokenId ?? crypto.randomBytes(8).toString("hex");
  payments.add(t);
  persistPayments();
  return t;
}

export function verifyPayment(token: string) {
  return payments.has(token);
}

export default { generatePowChallenge, verifyPow, createPayment, verifyPayment };
