import ergon, { PowChallenge } from "./ergon";
import { summarizeWithLLM } from "./llm";
import { loadAllSync, saveAllSync } from "./persistence";
import challenges, { Challenge as TimeChallenge } from "./challenges";

type SenderId = string;

export type ChallengeRecord = {
  sender: SenderId;
  challenge: PowChallenge;
  issuedAt: number;
  message?: string;
};

export type Decision =
  | { status: "challenge"; challenge: PowChallenge }
  | { status: "challenge"; challenge: PowChallenge; prompt?: string }
  | { status: "require_payment"; paymentRequest: string }
  | { status: "accepted"; summary: string }
  | { status: "rejected"; reason: string };

export class AntiScamGate {
  private challenges = new Map<string, ChallengeRecord>();
  private trusted = new Set<SenderId>();

  constructor(trustedSenders?: SenderId[]) {
    if (trustedSenders) trustedSenders.forEach((s) => this.trusted.add(s));

    // Load persisted trusted senders and challenges if present
    try {
      const st = loadAllSync();
      if (st && Array.isArray(st.trusted)) {
        st.trusted.forEach((s: string) => this.trusted.add(s));
      }
      if (st && Array.isArray(st.challenges)) {
        st.challenges.forEach((r: any) => {
          if (r && r.challenge && r.challenge.id) {
            this.challenges.set(r.challenge.id, { sender: r.sender, challenge: r.challenge, issuedAt: r.issuedAt, message: r.message });
          }
        });
      }
    } catch (e) {
      // ignore load errors in PoC
    }
  }

  private isSuspicious(message: string) {
    const suspiciousKeywords = [
      "free",
      "investment",
      "giveaway",
      "work from home",
      "urgent",
      "win",
      "airdrop",
      "click",
      "verify account",
      "transfer",
    ];
    const text = message.toLowerCase();
    return suspiciousKeywords.some((k) => text.includes(k));
  }

  private summarize(message: string) {
    // Keep a tiny synchronous fallback for immediate paths.
    const shortened = message.length > 200 ? message.slice(0, 197) + "..." : message;
    return `Summary: ${shortened}`;
  }

  async produceSummary(message: string): Promise<string> {
    return await summarizeWithLLM(message);
  }

  handleIncoming(sender: SenderId, message: string): Decision {
    if (this.trusted.has(sender)) return { status: "accepted", summary: this.summarize(message) };
    const suspicious = this.isSuspicious(message);
    // Generate one of the creative challenge types
    const ch = challenges.generateChallengeForMessage(message, suspicious);
    // store as a unified challenge record (for verification flows)
    this.challenges.set(ch.id, { sender, challenge: { id: ch.id, prefix: '', difficulty: 0 } as unknown as PowChallenge, issuedAt: Date.now(), message: JSON.stringify(ch) });
    const prompt = challenges.renderPrompt(ch);
    // persist state
    try {
      const st = loadAllSync();
      st.trusted = Array.from(this.trusted.values());
      st.challenges = Array.from(this.challenges.values()).map((r) => ({ sender: r.sender, challenge: r.challenge, issuedAt: r.issuedAt, message: r.message }));
      saveAllSync(st);
    } catch (e) {
      // ignore persistence errors in PoC
    }
    // return the initial challenge details to the sender
    return { status: 'challenge', challenge: { id: ch.id, prefix: JSON.stringify(ch.payload), difficulty: 0 } as unknown as PowChallenge, prompt };
  }

  async respondWithAnswer(sender: SenderId, challengeId: string, answer: string): Promise<Decision> {
    const rec = this.challenges.get(challengeId);
    if (!rec) return { status: 'rejected', reason: 'unknown challenge' };
    if (rec.sender !== sender) return { status: 'rejected', reason: 'sender mismatch' };
    // the stored message contains the serialized TimeChallenge
    const stored = rec.message ? JSON.parse(rec.message as string) as TimeChallenge : null;
    if (!stored) return { status: 'rejected', reason: 'invalid stored challenge' };
    const v = challenges.verifyResponse(stored, answer);
    if (v.status === 'rejected') return { status: 'rejected', reason: v.message ?? 'verification failed' };
    if (v.status === 'accepted') {
      this.challenges.delete(challengeId);
      // persist deletion
      try { const st = loadAllSync(); st.challenges = Array.from(this.challenges.values()).map((r) => ({ sender: r.sender, challenge: r.challenge, issuedAt: r.issuedAt, message: r.message })); saveAllSync(st);} catch(e){}
      const summary = stored ? await this.produceSummary(stored.payload?.large ? String(stored.payload.large).slice(0,200) : JSON.stringify(stored)) : `Accepted`;
      return { status: 'accepted', summary };
    }
    // continue: store next challenge if provided
    if (v.next) {
      const next = v.next;
      this.challenges.delete(challengeId);
      this.challenges.set(next.id, { sender, challenge: { id: next.id, prefix: JSON.stringify(next.payload), difficulty: 0 } as unknown as PowChallenge, issuedAt: Date.now(), message: JSON.stringify(next) });
      // persist
      try { const st = loadAllSync(); st.challenges = Array.from(this.challenges.values()).map((r) => ({ sender: r.sender, challenge: r.challenge, issuedAt: r.issuedAt, message: r.message })); saveAllSync(st);} catch(e){}
      return { status: 'challenge', challenge: { id: next.id, prefix: JSON.stringify(next.payload), difficulty: 0 } as unknown as PowChallenge };
    }
    return { status: 'rejected', reason: 'no next challenge' };
  }

  async respondWithPow(sender: SenderId, challengeId: string, nonce: string): Promise<Decision> {
    const rec = this.challenges.get(challengeId);
    if (!rec) return { status: "rejected", reason: "unknown challenge" };
    if (rec.sender !== sender) return { status: "rejected", reason: "sender mismatch" };
    const ok = ergon.verifyPow(rec.challenge, nonce);
    if (!ok) return { status: "rejected", reason: "invalid proof-of-work" };
    this.challenges.delete(challengeId);
    // persist state after deletion
    try {
      const st = loadAllSync();
      st.trusted = Array.from(this.trusted.values());
      st.challenges = Array.from(this.challenges.values()).map((r) => ({ sender: r.sender, challenge: r.challenge, issuedAt: r.issuedAt, message: r.message }));
      saveAllSync(st);
    } catch (e) {}
    const summary = rec.message ? await this.produceSummary(rec.message) : `PoW accepted for ${sender}`;
    return { status: "accepted", summary };
  }

  createPaymentRequest(sender: SenderId) {
    const token = ergon.createPayment();
    return token;
  }

  async respondWithPayment(sender: SenderId, token: string): Promise<Decision> {
    const ok = ergon.verifyPayment(token);
    if (!ok) return { status: "rejected", reason: "payment not found" };
    // Find a pending message for this sender (if any)
    const rec = Array.from(this.challenges.values()).reverse().find((r) => r.sender === sender);
    const message = rec?.message ?? '';
    if (rec && rec.challenge) this.challenges.delete(rec.challenge.id);
    // persist state after possible deletion
    try {
      const st = loadAllSync();
      st.trusted = Array.from(this.trusted.values());
      st.challenges = Array.from(this.challenges.values()).map((r) => ({ sender: r.sender, challenge: r.challenge, issuedAt: r.issuedAt, message: r.message }));
      saveAllSync(st);
    } catch (e) {}

    const summary = message ? await this.produceSummary(message) : `Payment accepted for ${sender}`;
    return { status: "accepted", summary };
  }
}

export default AntiScamGate;
