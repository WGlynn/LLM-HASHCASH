import AntiScamGate from "../services/antiScam";
import ergon from "../services/ergon";

async function solvePow(challenge: any, maxTries = 200000): Promise<string | null> {
  for (let i = 0; i < maxTries; i++) {
    const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36) + i.toString();
    if (ergon.verifyPow(challenge, nonce)) return nonce;
    if (i % 50000 === 0 && i > 0) await new Promise((r) => setTimeout(r, 0));
  }
  return null;
}

async function runDemo() {
  const gate = new AntiScamGate(["friend-123"]);

  const messages = [
    { sender: "friend-123", text: "Hey, long time no see — lunch?" },
    { sender: "unknown-1", text: "You won an airdrop! Click here to claim" },
    { sender: "recruiter-42", text: "We have a job opening you might like" },
  ];

  for (const m of messages) {
    console.log(`\nIncoming from ${m.sender}: ${m.text}`);
    const decision = gate.handleIncoming(m.sender, m.text);
    if (decision.status === "accepted") {
      console.log("Directly accepted:", decision.summary);
      continue;
    }
    if (decision.status === "rejected") {
      console.log("Rejected:", decision.reason);
      continue;
    }
    if (decision.status === "challenge") {
      console.log("Issued PoW challenge:", decision.challenge);
      const nonce = await solvePow(decision.challenge, 200000);
      if (nonce) {
        console.log("Found nonce, responding...");
        const r = gate.respondWithPow(m.sender, decision.challenge.id, nonce);
        console.log("Response:", r);
        continue;
      }
      console.log("Could not solve PoW quickly — falling back to payment.");
      const token = gate.createPaymentRequest(m.sender);
      console.log("Payment token created (demo):", token);
      const r = gate.respondWithPayment(m.sender, token, m.text);
      console.log("Response:", r);
    }
  }
}

runDemo().then(() => console.log("Demo finished."), (e) => console.error(e));
