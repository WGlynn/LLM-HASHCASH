const fs = require('fs');
const path = require('path');

const STATE = path.join(process.cwd(), 'data', 'antiscam_state.json');

function render(ch) {
  const t = ch.type;
  const p = ch.payload || {};
  switch (t) {
    case 'pow_chain': return `PoW chain stage ${p.stage}/${p.stages}. Prefix: ${p.challenge && p.challenge.prefix}`;
    case 'riddle_relay': return `Riddle: ${p.riddles && p.riddles[p.index] && p.riddles[p.index].q}`;
    case 'microtasks': return `Microtask ${p.index+1}/${(p.tasks && p.tasks.length) || 0}: ${(p.tasks && p.tasks[p.index] && p.tasks[p.index].prompt) || ''}`;
    case 'clarify_loop': return `Clarify: ${(p.questions && p.questions[p.index]) || ''}`;
    case 'format_bureaucracy': return `Fill JSON keys: ${p.schema ? Object.keys(p.schema).join(', ') : ''}`;
    case 'nested_captcha': return `Captcha: ${(p.captcha && p.captcha.q) || ''}`;
    case 'token_hunt': return `Token ${p.index+1}/${(p.tokens && p.tokens.length) || 0} to collect`;
    case 'expensive_work': return `Compute proof over a large workload (length ${p.large ? String(p.large).length : 0})`;
    case 'agent_marathon': return `Agent marathon round ${p.round+1}/${p.rounds}`;
    case 'false_lead': return `Choose a branch: ${(p.path && p.path.join(', ')) || ''}`;
    default: return `Unknown challenge type: ${t}`;
  }
}

function run() {
  if (!fs.existsSync(STATE)) { console.log('No state file at', STATE); return; }
  const st = JSON.parse(fs.readFileSync(STATE, 'utf8') || '{}');
  const chs = st.challenges || [];
  if (!chs.length) { console.log('No persisted challenges'); return; }
  console.log('Persisted challenges:');
  chs.forEach((r) => {
    try {
      const ch = JSON.parse(r.message);
      console.log('---');
      console.log('id:', ch.id, 'type:', ch.type);
      console.log(render(ch));
    } catch (e) { console.log('Error parsing challenge message'); }
  });
}

run();
