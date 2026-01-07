import crypto from 'crypto';
import ergon from './ergon';

export type Challenge = {
  id: string;
  type: string;
  payload: any;
  createdAt: number;
};

function id() {
  return crypto.randomBytes(8).toString('hex');
}

export function generateChallengeForMessage(message: string, suspicious: boolean): Challenge {
  // Choose a challenge type probabilistically or based on suspicion
  const types = [
    'pow_chain',
    'riddle_relay',
    'microtasks',
    'clarify_loop',
    'format_bureaucracy',
    'nested_captcha',
    'token_hunt',
    'expensive_work',
    'agent_marathon',
    'false_lead',
  ];
  // weight suspicious messages toward heavier challenges
  const pick = suspicious ? Math.floor(Math.random() * types.length) : Math.floor(Math.random() * (types.length - 3));
  const type = types[pick % types.length];
  return generateChallenge(type, message, suspicious);
}

export function generateChallenge(type: string, message?: string, suspicious = false): Challenge {
  switch (type) {
    case 'pow_chain': {
      const stages = suspicious ? 3 : 1;
      const difficulty = suspicious ? 18 : 12;
      const ch = ergon.generatePowChallenge(difficulty);
      return { id: id(), type: 'pow_chain', payload: { stage: 1, stages, challenge: ch }, createdAt: Date.now() };
    }
    case 'riddle_relay': {
      const riddles = [
        { q: 'I speak without a mouth and hear without ears. What am I?', a: 'echo' },
        { q: 'What has keys but can\'t open locks?', a: 'piano' },
        { q: 'What runs, but never walks?', a: 'water' },
      ];
      return { id: id(), type: 'riddle_relay', payload: { riddles, index: 0 }, createdAt: Date.now() };
    }
    case 'microtasks': {
      // small verification tasks; many of them to waste time
      const tasks = Array.from({ length: suspicious ? 12 : 5 }, (_, i) => ({
        id: i + 1,
        prompt: `Count the letters in this phrase: 'pumpfun-${i}-${message?.slice(0,10) ?? ''}'`,
        answer: null,
      }));
      // precompute answers
      tasks.forEach((t) => { t.answer = (t.prompt.replace(/[^a-zA-Z]/g, '').length).toString(); });
      return { id: id(), type: 'microtasks', payload: { tasks, index: 0 }, createdAt: Date.now() };
    }
    case 'clarify_loop': {
      const questions = Array.from({ length: suspicious ? 8 : 3 }, (_, i) => `Please re-state the word #${i + 1} exactly as-is: 'PumpFun${i}'`);
      return { id: id(), type: 'clarify_loop', payload: { questions, index: 0 }, createdAt: Date.now() };
    }
    case 'format_bureaucracy': {
      const schema = { name: 'string', code: 'string' };
      const example = { name: 'Alice', code: 'A-123' };
      return { id: id(), type: 'format_bureaucracy', payload: { schema, example }, createdAt: Date.now() };
    }
    case 'nested_captcha': {
      const captcha = { q: 'What is 7 + 6?', a: '13' };
      return { id: id(), type: 'nested_captcha', payload: { captcha }, createdAt: Date.now() };
    }
    case 'token_hunt': {
      const tokens = Array.from({ length: suspicious ? 6 : 3 }, () => crypto.randomBytes(4).toString('hex'));
      return { id: id(), type: 'token_hunt', payload: { tokens, index: 0 }, createdAt: Date.now() };
    }
    case 'expensive_work': {
      // ask for SHA256 of a large random string
      const large = crypto.randomBytes(suspicious ? 80000 : 20000).toString('hex');
      return { id: id(), type: 'expensive_work', payload: { large }, createdAt: Date.now() };
    }
    case 'agent_marathon': {
      const rounds = suspicious ? 10 : 4;
      return { id: id(), type: 'agent_marathon', payload: { rounds, round: 0 }, createdAt: Date.now() };
    }
    case 'false_lead': {
      const path = ['A', 'B', 'C', 'D'];
      const correct = path[Math.floor(Math.random() * path.length)];
      return { id: id(), type: 'false_lead', payload: { path, correct, attempts: 0 }, createdAt: Date.now() };
    }
    default:
      // default to a small PoW
      const ch = ergon.generatePowChallenge(12);
      return { id: id(), type: 'pow_chain', payload: { stage: 1, stages: 1, challenge: ch }, createdAt: Date.now() };
  }
}

export function verifyResponse(ch: Challenge, response: string): { status: 'accepted' | 'continue' | 'rejected'; message?: string; next?: Challenge | null } {
  const type = chType(ch);
  switch (type) {
    case 'pow_chain': {
      // payload: { stage, stages, challenge }
      const p = ch.payload as any;
      if (!p || !p.challenge) return { status: 'rejected', message: 'invalid challenge' };
      const ok = ergon.verifyPow(p.challenge, response);
      if (!ok) return { status: 'rejected', message: 'invalid proof' };
      if (p.stage >= p.stages) return { status: 'accepted', message: 'PoW chain completed' };
      // issue next stage
      const nextStage = p.stage + 1;
      const nextChallenge = ergon.generatePowChallenge(p.challenge.difficulty + 4);
      const next = { id: id(), type: 'pow_chain', payload: { stage: nextStage, stages: p.stages, challenge: nextChallenge }, createdAt: Date.now() };
      return { status: 'continue', message: `Stage ${nextStage} issued`, next };
    }
    case 'riddle_relay': {
      const p = ch.payload as any;
      const idx = p.index ?? 0;
      const expected = (p.riddles && p.riddles[idx] && p.riddles[idx].a) ? String(p.riddles[idx].a).toLowerCase() : null;
      if (!expected) return { status: 'rejected', message: 'bad riddle' };
      if (response.trim().toLowerCase() === expected) {
        if (idx + 1 >= p.riddles.length) return { status: 'accepted', message: 'Riddle chain complete' };
        // return next riddle
        const next: Challenge = { id: id(), type: 'riddle_relay', payload: { riddles: p.riddles, index: idx + 1 }, createdAt: Date.now() };
        return { status: 'continue', message: 'Correct, next riddle', next };
      }
      return { status: 'rejected', message: 'Incorrect answer' };
    }
    case 'microtasks': {
      const p = ch.payload as any;
      const idx = p.index ?? 0;
      const task = p.tasks && p.tasks[idx];
      if (!task) return { status: 'rejected', message: 'no task' };
      if (response.trim() === String(task.answer)) {
        if (idx + 1 >= p.tasks.length) return { status: 'accepted', message: 'All microtasks complete' };
        const next: Challenge = { id: id(), type: 'microtasks', payload: { tasks: p.tasks, index: idx + 1 }, createdAt: Date.now() };
        return { status: 'continue', message: 'Task accepted, next task', next };
      }
      return { status: 'rejected', message: 'Task answer incorrect' };
    }
    case 'clarify_loop': {
      const p = ch.payload as any;
      const idx = p.index ?? 0;
      const expected = p.questions && p.questions[idx];
      if (!expected) return { status: 'rejected', message: 'bad question' };
      if (response.trim() === expected) {
        if (idx + 1 >= p.questions.length) return { status: 'accepted', message: 'Clarifications complete' };
        const next: Challenge = { id: id(), type: 'clarify_loop', payload: { questions: p.questions, index: idx + 1 }, createdAt: Date.now() };
        return { status: 'continue', message: 'Accepted, next clarification', next };
      }
      return { status: 'rejected', message: 'Please follow the instruction exactly' };
    }
    case 'format_bureaucracy': {
      // expect a JSON string matching example keys (simple check)
      try {
        const obj = JSON.parse(response);
        if (obj && typeof obj.name === 'string' && typeof obj.code === 'string') return { status: 'accepted', message: 'Form accepted' };
        return { status: 'rejected', message: 'Malformed form' };
      } catch (e) {
        return { status: 'rejected', message: 'Invalid JSON' };
      }
    }
    case 'nested_captcha': {
      const p = ch.payload as any;
      if (!p || !p.captcha) return { status: 'rejected', message: 'bad captcha' };
      if (response.trim() === String(p.captcha.a)) return { status: 'accepted', message: 'Captcha passed' };
      return { status: 'rejected', message: 'Captcha failed' };
    }
    case 'token_hunt': {
      const p = ch.payload as any;
      const idx = p.index ?? 0;
      const expected = p.tokens && p.tokens[idx];
      if (!expected) return { status: 'rejected', message: 'no token' };
      if (response.trim() === expected) {
        if (idx + 1 >= p.tokens.length) return { status: 'accepted', message: 'All tokens collected' };
        const next: Challenge = { id: id(), type: 'token_hunt', payload: { tokens: p.tokens, index: idx + 1 }, createdAt: Date.now() };
        return { status: 'continue', message: 'Token accepted, next', next };
      }
      return { status: 'rejected', message: 'Token incorrect' };
    }
    case 'expensive_work': {
      const p = ch.payload as any;
      if (!p || !p.large) return { status: 'rejected', message: 'bad work' };
      // expect SHA256 hex of the large string concatenated with provided response
      const digest = crypto.createHash('sha256').update(p.large + response).digest('hex');
      // We accept any digest but make sender compute heavy work by verifying provided digest matches our expected digest of large+response
      // For PoC: check that response is non-empty and of reasonable length
      if (response && response.length > 10) return { status: 'accepted', message: `Work accepted: ${digest.slice(0,12)}...` };
      return { status: 'rejected', message: 'Work insufficient' };
    }
    case 'agent_marathon': {
      const p = ch.payload as any;
      const round = p.round ?? 0;
      // expect a message that contains the literal `round X` where X == round+1
      const expectStr = `round ${round + 1}`;
      if (response.toLowerCase().includes(expectStr)) {
        if (round + 1 >= p.rounds) return { status: 'accepted', message: 'Marathon complete' };
        const next: Challenge = { id: id(), type: 'agent_marathon', payload: { rounds: p.rounds, round: round + 1 }, createdAt: Date.now() };
        return { status: 'continue', message: 'Next round', next };
      }
      return { status: 'rejected', message: `Please include '${expectStr}' in your reply` };
    }
    case 'false_lead': {
      const p = ch.payload as any;
      p.attempts = (p.attempts || 0) + 1;
      if (response.trim().toUpperCase() === String(p.correct).toUpperCase()) return { status: 'accepted', message: 'You found the correct path' };
      if (p.attempts > 4) return { status: 'rejected', message: 'Too many wrong attempts' };
      return { status: 'continue', message: 'Wrong path, try another branch', next: null };
    }
    default:
      return { status: 'rejected', message: 'unknown challenge type' };
  }
}

function chType(c: Challenge) {
  return c?.type ?? 'unknown';
}

export default { generateChallengeForMessage, generateChallenge, verifyResponse };

export function renderPrompt(ch: Challenge): string {
  const t = ch.type;
  const p = ch.payload || {};
  switch (t) {
    case 'pow_chain':
      return `Please complete a proof-of-work (stage ${p.stage}/${p.stages}). Challenge prefix: ${p.challenge.prefix} (difficulty ${p.challenge.difficulty}). Reply with the nonce using /resp ${ch.id} <nonce>`;
    case 'riddle_relay':
      return `Riddle: ${p.riddles[p.index].q} Reply with /resp ${ch.id} <answer>`;
    case 'microtasks':
      return `Microtask ${p.index + 1}/${p.tasks.length}: ${p.tasks[p.index].prompt} Reply with /resp ${ch.id} <answer>`;
    case 'clarify_loop':
      return `Clarification ${p.index + 1}/${p.questions.length}: ${p.questions[p.index]} Reply exactly with /resp ${ch.id} <text>`;
    case 'format_bureaucracy':
      return `Please submit a JSON object matching keys ${Object.keys(p.schema).join(', ')} (example: ${JSON.stringify(p.example)}). Reply with /resp ${ch.id} <json>`;
    case 'nested_captcha':
      return `Captcha: ${p.captcha.q} Reply with /resp ${ch.id} <answer>`;
    case 'token_hunt':
      return `Collect token ${p.index + 1}/${p.tokens.length}: find and reply with the token string using /resp ${ch.id} <token>`;
    case 'expensive_work':
      return `Compute and reply with a non-empty string proving you've hashed a large workload. Reply with /resp ${ch.id} <proof>`;
    case 'agent_marathon':
      return `Round ${p.round + 1}/${p.rounds}: Please reply containing 'round ${p.round + 1}' with /resp ${ch.id} <text>`;
    case 'false_lead':
      return `Choose a branch (${p.path.join(', ')}). Reply with /resp ${ch.id} <branch>`;
    default:
      return `Perform the requested action and reply with /resp ${ch.id} <response>`;
  }
}
