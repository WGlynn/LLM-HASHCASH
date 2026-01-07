const challenges = require('../services/challenges');

async function simulateOne(type, suspicious=false) {
  const ch = challenges.generateChallenge(type, 'demo message', suspicious);
  console.log('\n=== New challenge ===');
  console.log('id:', ch.id, 'type:', ch.type);
  console.log('prompt:\n', challenges.renderPrompt(ch));

  // Auto-solve some challenge types for demo
  switch (ch.type) {
    case 'riddle_relay': {
      const answer = ch.payload.riddles[ch.payload.index].a;
      console.log('Simulated answer:', answer);
      const res = challenges.verifyResponse(ch, answer);
      console.log('Result:', res);
      if (res.next) console.log('Next prompt:\n', challenges.renderPrompt(res.next));
      break;
    }
    case 'microtasks': {
      const t = ch.payload.tasks[ch.payload.index];
      const answer = t.answer;
      console.log('Simulated answer:', answer);
      const res = challenges.verifyResponse(ch, answer);
      console.log('Result:', res);
      break;
    }
    case 'pow_chain': {
      // won't actually compute heavy PoW in demo; simulate failure then show next
      console.log('Simulating failed PoW — returning rejected');
      const res = challenges.verifyResponse(ch, 'bad-nonce');
      console.log('Result:', res);
      break;
    }
    case 'false_lead': {
      const wrong = 'Z';
      console.log('Simulated wrong branch:', wrong);
      console.log('Result:', challenges.verifyResponse(ch, wrong));
      break;
    }
    default:
      console.log('No auto-solver for this type in demo.');
  }
}

function run() {
  const types = ['pow_chain','riddle_relay','microtasks','clarify_loop','format_bureaucracy','nested_captcha','token_hunt','expensive_work','agent_marathon','false_lead'];
  for (const t of types) simulateOne(t, true);
}

run();
