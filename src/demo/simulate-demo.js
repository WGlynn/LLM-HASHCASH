const challenges = require('../services/challenges');

async function simulateOne(type) {
  console.log('\n--- Simulating', type);
  const ch = challenges.generateChallenge(type, 'demo-message', true);
  console.log('Prompt:', challenges.renderPrompt(ch));

  // Compute a plausible correct answer depending on type
  let answer;
  switch (ch.type) {
    case 'pow_chain': {
      // brute force nonce for demo difficulty
      const c = ch.payload.challenge;
      let nonce = null;
      for (let i = 0; i < 200000; i++) {
        const n = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36) + i.toString();
        if (require('../services/ergon').verifyPow(c, n)) { nonce = n; break; }
      }
      answer = nonce || 'simulated-nonce';
      break;
    }
    case 'riddle_relay': answer = ch.payload.riddles[0].a; break;
    case 'microtasks': answer = ch.payload.tasks[0].answer; break;
    case 'clarify_loop': answer = ch.payload.questions[0]; break;
    case 'format_bureaucracy': answer = JSON.stringify(ch.payload.example); break;
    case 'nested_captcha': answer = ch.payload.captcha.a; break;
    case 'token_hunt': answer = ch.payload.tokens[0]; break;
    case 'expensive_work': answer = 'proof-of-work-demo'; break;
    case 'agent_marathon': answer = `round 1 demo`; break;
    case 'false_lead': answer = ch.payload.correct; break;
    default: answer = 'ok';
  }

  let res = challenges.verifyResponse(ch, answer);
  console.log('Response result:', res.status, res.message || '');
  while (res.status === 'continue' && res.next) {
    console.log('Next prompt:', challenges.renderPrompt(res.next));
    const next = res.next;
    // provide next step answer automatically (try to pick correct answer)
    let ans;
    switch (next.type) {
      case 'riddle_relay': ans = next.payload.riddles[next.payload.index].a; break;
      case 'microtasks': ans = next.payload.tasks[next.payload.index].answer; break;
      case 'pow_chain': ans = 'simulated-nonce'; break;
      case 'token_hunt': ans = next.payload.tokens[next.payload.index]; break;
      case 'agent_marathon': ans = `round ${next.payload.round+1}`; break;
      default: ans = 'ok';
    }
    res = challenges.verifyResponse(next, ans);
    console.log('->', res.status, res.message || '');
    if (res.status === 'rejected') break;
  }
}

async function runAll() {
  const types = ['pow_chain','riddle_relay','microtasks','clarify_loop','format_bureaucracy','nested_captcha','token_hunt','expensive_work','agent_marathon','false_lead'];
  for (const t of types) await simulateOne(t);
  console.log('\nSimulation complete');
}

runAll();
