const crypto = require('crypto');
const ergon = require('./ergon');

function id() { return crypto.randomBytes(8).toString('hex'); }

function generateChallenge(type, message, suspicious) {
  suspicious = !!suspicious;
  const crypto = require('crypto');
  const ergon = require('./ergon');

  function id() { return crypto.randomBytes(8).toString('hex'); }

  function generateChallengeForMessage(message, suspicious) {
    const types = [
      'pow_chain','riddle_relay','microtasks','clarify_loop','format_bureaucracy','nested_captcha','token_hunt','expensive_work','agent_marathon','false_lead'
    ];
    const pick = suspicious ? Math.floor(Math.random() * types.length) : Math.floor(Math.random() * (types.length - 3));
    const type = types[pick % types.length];
    return generateChallenge(type, message, suspicious);
  }

  function generateChallenge(type, message, suspicious) {
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
        const tasks = Array.from({ length: suspicious ? 12 : 5 }, (_, i) => ({
          id: i + 1,
          prompt: `Count the letters in this phrase: 'pumpfun-${i}-${(message||'').slice(0,10)}'`,
          answer: null,
        }));
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
      default: {
        const ch = ergon.generatePowChallenge(12);
        return { id: id(), type: 'pow_chain', payload: { stage: 1, stages: 1, challenge: ch }, createdAt: Date.now() };
      }
    }
  }

  function verifyResponse(ch, response) {
    const type = ch && ch.type;
    switch (type) {
      case 'pow_chain': {
        const p = ch.payload;
        if (!p || !p.challenge) return { status: 'rejected', message: 'invalid challenge' };
        const ok = ergon.verifyPow(p.challenge, response);
        if (!ok) return { status: 'rejected', message: 'invalid proof' };
        if (p.stage >= p.stages) return { status: 'accepted', message: 'PoW chain completed' };
        const nextStage = p.stage + 1;
        const nextChallenge = ergon.generatePowChallenge((p.challenge && p.challenge.difficulty) ? p.challenge.difficulty + 4 : 16);
        const next = { id: id(), type: 'pow_chain', payload: { stage: nextStage, stages: p.stages, challenge: nextChallenge }, createdAt: Date.now() };
        return { status: 'continue', message: `Stage ${nextStage} issued`, next };
      }
      case 'riddle_relay': {
        const p = ch.payload;
        const idx = p.index || 0;
        const expected = p.riddles && p.riddles[idx] && String(p.riddles[idx].a).toLowerCase();
        if (!expected) return { status: 'rejected', message: 'bad riddle' };
        if (String(response).trim().toLowerCase() === expected) {
          if (idx + 1 >= p.riddles.length) return { status: 'accepted', message: 'Riddle chain complete' };
          const next = { id: id(), type: 'riddle_relay', payload: { riddles: p.riddles, index: idx + 1 }, createdAt: Date.now() };
          return { status: 'continue', message: 'Correct, next riddle', next };
        }
        return { status: 'rejected', message: 'Incorrect answer' };
      }
      case 'microtasks': {
        const p = ch.payload; const idx = p.index || 0; const task = p.tasks && p.tasks[idx];
        if (!task) return { status: 'rejected', message: 'no task' };
        if (String(response).trim() === String(task.answer)) {
          if (idx + 1 >= p.tasks.length) return { status: 'accepted', message: 'All microtasks complete' };
          const next = { id: id(), type: 'microtasks', payload: { tasks: p.tasks, index: idx + 1 }, createdAt: Date.now() };
          return { status: 'continue', message: 'Task accepted, next task', next };
        }
        return { status: 'rejected', message: 'Task answer incorrect' };
      }
      case 'clarify_loop': {
        const p = ch.payload; const idx = p.index || 0; const expected = p.questions && p.questions[idx];
        if (!expected) return { status: 'rejected', message: 'bad question' };
        if (String(response).trim() === expected) {
          if (idx + 1 >= p.questions.length) return { status: 'accepted', message: 'Clarifications complete' };
          const next = { id: id(), type: 'clarify_loop', payload: { questions: p.questions, index: idx + 1 }, createdAt: Date.now() };
          return { status: 'continue', message: 'Accepted, next clarification', next };
        }
        return { status: 'rejected', message: 'Please follow the instruction exactly' };
      }
      case 'format_bureaucracy': {
        try { const obj = JSON.parse(response); if (obj && typeof obj.name === 'string' && typeof obj.code === 'string') return { status: 'accepted', message: 'Form accepted' }; return { status: 'rejected', message: 'Malformed form' }; } catch (e) { return { status: 'rejected', message: 'Invalid JSON' }; }
      }
      case 'nested_captcha': {
        const p = ch.payload; if (!p || !p.captcha) return { status: 'rejected', message: 'bad captcha' }; if (String(response).trim() === String(p.captcha.a)) return { status: 'accepted', message: 'Captcha passed' }; return { status: 'rejected', message: 'Captcha failed' };
      }
      case 'token_hunt': {
        const p = ch.payload; const idx = p.index || 0; const expected = p.tokens && p.tokens[idx]; if (!expected) return { status: 'rejected', message: 'no token' };
        if (String(response).trim() === expected) { if (idx + 1 >= p.tokens.length) return { status: 'accepted', message: 'All tokens collected' }; const next = { id: id(), type: 'token_hunt', payload: { tokens: p.tokens, index: idx + 1 }, createdAt: Date.now() }; return { status: 'continue', message: 'Token accepted, next', next }; }
        return { status: 'rejected', message: 'Token incorrect' };
      }
      case 'expensive_work': {
        const p = ch.payload; if (!p || !p.large) return { status: 'rejected', message: 'bad work' };
        const digest = crypto.createHash('sha256').update(p.large + response).digest('hex');
        if (response && String(response).length > 10) return { status: 'accepted', message: `Work accepted: ${digest.slice(0,12)}...` };
        return { status: 'rejected', message: 'Work insufficient' };
      }
      case 'agent_marathon': {
        const p = ch.payload; const round = p.round || 0; const expectStr = `round ${round + 1}`;
        if (String(response).toLowerCase().includes(expectStr)) { if (round + 1 >= p.rounds) return { status: 'accepted', message: 'Marathon complete' }; const next = { id: id(), type: 'agent_marathon', payload: { rounds: p.rounds, round: round + 1 }, createdAt: Date.now() }; return { status: 'continue', message: 'Next round', next }; }
        return { status: 'rejected', message: `Please include '${expectStr}' in your reply` };
      }
      case 'false_lead': {
        const p = ch.payload; p.attempts = (p.attempts || 0) + 1; if (String(response).trim().toUpperCase() === String(p.correct).toUpperCase()) return { status: 'accepted', message: 'You found the correct path' }; if (p.attempts > 4) return { status: 'rejected', message: 'Too many wrong attempts' }; return { status: 'continue', message: 'Wrong path, try another branch', next: null };
      }
      default: return { status: 'rejected', message: 'unknown challenge type' };
    }
  }

  function renderPrompt(ch) {
    const t = ch.type; const p = ch.payload || {};
    switch (t) {
      case 'pow_chain': return `🔐 **Proof-of-Work** — Stage ${p.stage}/${p.stages}\nPrefix: \`${p.challenge && p.challenge.prefix}\`\nReply with: /resp ${ch.id} <nonce>`;
      case 'riddle_relay': return `🧩 **Riddle**: ${p.riddles && p.riddles[p.index] && p.riddles[p.index].q}\nReply: /resp ${ch.id} <answer>`;
      case 'microtasks': return `📝 **Microtask** ${p.index+1}/${(p.tasks && p.tasks.length)||0}: ${(p.tasks && p.tasks[p.index] && p.tasks[p.index].prompt)||''}\nReply: /resp ${ch.id} <answer>`;
      case 'clarify_loop': return `🔁 **Clarify**: ${(p.questions && p.questions[p.index])||''}\nReply exactly: /resp ${ch.id} <text>`;
      case 'format_bureaucracy': return `📋 **Form**: Provide JSON keys ${p.schema ? Object.keys(p.schema).join(', ') : ''}\nReply: /resp ${ch.id} <json>`;
      case 'nested_captcha': return `🛡️ **Captcha**: ${p.captcha && p.captcha.q}\nReply: /resp ${ch.id} <answer>`;
      case 'token_hunt': return `🔎 **Token Hunt**: collect token ${p.index+1}/${(p.tokens && p.tokens.length)||0}\nReply: /resp ${ch.id} <token>`;
      case 'expensive_work': return `⚙️ **Workload**: compute proof over a large workload and reply with /resp ${ch.id} <proof>`;
      case 'agent_marathon': return `🏁 **Marathon** Round ${p.round+1}/${p.rounds}\nReply with /resp ${ch.id} <text containing 'round ${p.round+1}'>`;
      case 'false_lead': return `🧭 **Choose** a branch: ${(p.path && p.path.join(', '))||''}\nReply: /resp ${ch.id} <branch>`;
      default: return `Perform the requested action and reply /resp ${ch.id} <response>`;
    }
  }

  module.exports = { generateChallengeForMessage, generateChallenge, verifyResponse, renderPrompt };
        }
        case 'agent_marathon': {
          const p = ch.payload; const round = p.round || 0; const expectStr = `round ${round + 1}`;
          if (String(response).toLowerCase().includes(expectStr)) { if (round + 1 >= p.rounds) return { status: 'accepted', message: 'Marathon complete' }; const next = { id: id(), type: 'agent_marathon', payload: { rounds: p.rounds, round: round + 1 }, createdAt: Date.now() }; return { status: 'continue', message: 'Next round', next }; }
          return { status: 'rejected', message: `Please include '${expectStr}' in your reply` };
        }
        case 'false_lead': {
          const p = ch.payload; p.attempts = (p.attempts || 0) + 1; if (String(response).trim().toUpperCase() === String(p.correct).toUpperCase()) return { status: 'accepted', message: 'You found the correct path' }; if (p.attempts > 4) return { status: 'rejected', message: 'Too many wrong attempts' }; return { status: 'continue', message: 'Wrong path, try another branch', next: null };
        }
        default: return { status: 'rejected', message: 'unknown challenge type' };
      }
    }

    function renderPrompt(ch) {
      const t = ch.type; const p = ch.payload || {};
      switch (t) {
        case 'pow_chain': return `🔐 **Proof-of-Work** — Stage ${p.stage}/${p.stages}\nPrefix: \`${p.challenge && p.challenge.prefix}\`\nReply with: /resp ${ch.id} <nonce>`;
        case 'riddle_relay': return `🧩 **Riddle**: ${p.riddles && p.riddles[p.index] && p.riddles[p.index].q}\nReply: /resp ${ch.id} <answer>`;
        case 'microtasks': return `📝 **Microtask** ${p.index+1}/${(p.tasks && p.tasks.length)||0}: ${(p.tasks && p.tasks[p.index] && p.tasks[p.index].prompt)||''}\nReply: /resp ${ch.id} <answer>`;
        case 'clarify_loop': return `🔁 **Clarify**: ${(p.questions && p.questions[p.index])||''}\nReply exactly: /resp ${ch.id} <text>`;
        case 'format_bureaucracy': return `📋 **Form**: Provide JSON keys ${p.schema ? Object.keys(p.schema).join(', ') : ''}\nReply: /resp ${ch.id} <json>`;
        case 'nested_captcha': return `🛡️ **Captcha**: ${p.captcha && p.captcha.q}\nReply: /resp ${ch.id} <answer>`;
        case 'token_hunt': return `🔎 **Token Hunt**: collect token ${p.index+1}/${(p.tokens && p.tokens.length)||0}\nReply: /resp ${ch.id} <token>`;
        case 'expensive_work': return `⚙️ **Workload**: compute proof over a large workload and reply with /resp ${ch.id} <proof>`;
        case 'agent_marathon': return `🏁 **Marathon** Round ${p.round+1}/${p.rounds}\nReply with /resp ${ch.id} <text containing 'round ${p.round+1}'>`;
        case 'false_lead': return `🧭 **Choose** a branch: ${(p.path && p.path.join(', '))||''}\nReply: /resp ${ch.id} <branch>`;
        default: return `Perform the requested action and reply /resp ${ch.id} <response>`;
      }
    }

    module.exports = { generateChallengeForMessage, generateChallenge, verifyResponse, renderPrompt };
    }
  }
}

function verifyResponse(ch, response) {
  const type = ch && ch.type;
  switch (type) {
    case 'pow_chain': {
      const p = ch.payload;
      if (!p || !p.challenge) return { status: 'rejected', message: 'invalid challenge' };
      const ok = ergon.verifyPow(p.challenge, response);
      if (!ok) return { status: 'rejected', message: 'invalid proof' };
      if (p.stage >= p.stages) return { status: 'accepted', message: 'PoW chain completed' };
      const nextStage = p.stage + 1;
      const nextChallenge = ergon.generatePowChallenge((p.challenge && p.challenge.difficulty) ? p.challenge.difficulty + 4 : 16);
      const next = { id: id(), type: 'pow_chain', payload: { stage: nextStage, stages: p.stages, challenge: nextChallenge }, createdAt: Date.now() };
      return { status: 'continue', message: `Stage ${nextStage} issued`, next };
    }
    case 'riddle_relay': {
      const p = ch.payload;
      const idx = p.index || 0;
      const expected = p.riddles && p.riddles[idx] && String(p.riddles[idx].a).toLowerCase();
      if (!expected) return { status: 'rejected', message: 'bad riddle' };
      if (String(response).trim().toLowerCase() === expected) {
        if (idx + 1 >= p.riddles.length) return { status: 'accepted', message: 'Riddle chain complete' };
        const next = { id: id(), type: 'riddle_relay', payload: { riddles: p.riddles, index: idx + 1 }, createdAt: Date.now() };
        return { status: 'continue', message: 'Correct, next riddle', next };
      }
      return { status: 'rejected', message: 'Incorrect answer' };
    }
    case 'microtasks': {
      const p = ch.payload; const idx = p.index || 0; const task = p.tasks && p.tasks[idx];
      if (!task) return { status: 'rejected', message: 'no task' };
      if (String(response).trim() === String(task.answer)) {
        if (idx + 1 >= p.tasks.length) return { status: 'accepted', message: 'All microtasks complete' };
        const next = { id: id(), type: 'microtasks', payload: { tasks: p.tasks, index: idx + 1 }, createdAt: Date.now() };
        return { status: 'continue', message: 'Task accepted, next task', next };
      }
      return { status: 'rejected', message: 'Task answer incorrect' };
    }
    case 'clarify_loop': {
      const p = ch.payload; const idx = p.index || 0; const expected = p.questions && p.questions[idx];
      if (!expected) return { status: 'rejected', message: 'bad question' };
      if (String(response).trim() === expected) {
        if (idx + 1 >= p.questions.length) return { status: 'accepted', message: 'Clarifications complete' };
        const next = { id: id(), type: 'clarify_loop', payload: { questions: p.questions, index: idx + 1 }, createdAt: Date.now() };
        return { status: 'continue', message: 'Accepted, next clarification', next };
      }
      return { status: 'rejected', message: 'Please follow the instruction exactly' };
    }
    case 'format_bureaucracy': {
      try { const obj = JSON.parse(response); if (obj && typeof obj.name === 'string' && typeof obj.code === 'string') return { status: 'accepted', message: 'Form accepted' }; return { status: 'rejected', message: 'Malformed form' }; } catch (e) { return { status: 'rejected', message: 'Invalid JSON' }; }
    }
    case 'nested_captcha': {
      const p = ch.payload; if (!p || !p.captcha) return { status: 'rejected', message: 'bad captcha' }; if (String(response).trim() === String(p.captcha.a)) return { status: 'accepted', message: 'Captcha passed' }; return { status: 'rejected', message: 'Captcha failed' };
    }
    case 'token_hunt': {
      const p = ch.payload; const idx = p.index || 0; const expected = p.tokens && p.tokens[idx]; if (!expected) return { status: 'rejected', message: 'no token' };
      if (String(response).trim() === expected) { if (idx + 1 >= p.tokens.length) return { status: 'accepted', message: 'All tokens collected' }; const next = { id: id(), type: 'token_hunt', payload: { tokens: p.tokens, index: idx + 1 }, createdAt: Date.now() }; return { status: 'continue', message: 'Token accepted, next', next }; }
      return { status: 'rejected', message: 'Token incorrect' };
    }
    case 'expensive_work': {
      const p = ch.payload; if (!p || !p.large) return { status: 'rejected', message: 'bad work' };
      const digest = crypto.createHash('sha256').update(p.large + response).digest('hex');
      if (response && String(response).length > 10) return { status: 'accepted', message: `Work accepted: ${digest.slice(0,12)}...` };
      return { status: 'rejected', message: 'Work insufficient' };
    }
    case 'agent_marathon': {
      const p = ch.payload; const round = p.round || 0; const expectStr = `round ${round + 1}`;
      if (String(response).toLowerCase().includes(expectStr)) { if (round + 1 >= p.rounds) return { status: 'accepted', message: 'Marathon complete' }; const next = { id: id(), type: 'agent_marathon', payload: { rounds: p.rounds, round: round + 1 }, createdAt: Date.now() }; return { status: 'continue', message: 'Next round', next }; }
      return { status: 'rejected', message: `Please include '${expectStr}' in your reply` };
    }
    case 'false_lead': {
      const p = ch.payload; p.attempts = (p.attempts || 0) + 1; if (String(response).trim().toUpperCase() === String(p.correct).toUpperCase()) return { status: 'accepted', message: 'You found the correct path' }; if (p.attempts > 4) return { status: 'rejected', message: 'Too many wrong attempts' }; return { status: 'continue', message: 'Wrong path, try another branch', next: null };
    }
    default: return { status: 'rejected', message: 'unknown challenge type' };
  }
}

function renderPrompt(ch) {
  const t = ch.type; const p = ch.payload || {};
  switch (t) {
    case 'pow_chain': return `🔐 **Proof-of-Work** — Stage ${p.stage}/${p.stages}\nPrefix: \\`${p.challenge && p.challenge.prefix}\\`\nReply with: /resp ${ch.id} <nonce>`;
    case 'riddle_relay': return `🧩 **Riddle**: ${p.riddles && p.riddles[p.index] && p.riddles[p.index].q}\nReply: /resp ${ch.id} <answer>`;
    case 'microtasks': return `📝 **Microtask** ${p.index+1}/${(p.tasks && p.tasks.length)||0}: ${(p.tasks && p.tasks[p.index] && p.tasks[p.index].prompt)||''}\nReply: /resp ${ch.id} <answer>`;
    case 'clarify_loop': return `🔁 **Clarify**: ${(p.questions && p.questions[p.index])||''}\nReply exactly: /resp ${ch.id} <text>`;
    case 'format_bureaucracy': return `📋 **Form**: Provide JSON keys ${p.schema ? Object.keys(p.schema).join(', ') : ''}\nReply: /resp ${ch.id} <json>`;
    case 'nested_captcha': return `🛡️ **Captcha**: ${p.captcha && p.captcha.q}\nReply: /resp ${ch.id} <answer>`;
    case 'token_hunt': return `🔎 **Token Hunt**: collect token ${p.index+1}/${(p.tokens && p.tokens.length)||0}\nReply: /resp ${ch.id} <token>`;
    case 'expensive_work': return `⚙️ **Workload**: compute proof over a large workload and reply with /resp ${ch.id} <proof>`;
    case 'agent_marathon': return `🏁 **Marathon** Round ${p.round+1}/${p.rounds}\nReply with /resp ${ch.id} <text containing 'round ${p.round+1}'>`;
    case 'false_lead': return `🧭 **Choose** a branch: ${(p.path && p.path.join(', '))||''}\nReply: /resp ${ch.id} <branch>`;
    default: return `Perform the requested action and reply /resp ${ch.id} <response>`;
  }
}

module.exports = { generateChallengeForMessage, generateChallenge, verifyResponse, renderPrompt };
