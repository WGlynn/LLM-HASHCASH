const assert = require('assert');
const challenges = require('../services/challenges');

function testRiddle() {
  const ch = challenges.generateChallenge('riddle_relay', 'hi', false);
  const q = ch.payload.riddles[0];
  const res = challenges.verifyResponse(ch, q.a);
  assert.strictEqual(res.status, 'continue' || 'accepted');
}

function testMicrotask() {
  const ch = challenges.generateChallenge('microtasks', 'abcdef', false);
  const task = ch.payload.tasks[0];
  const res = challenges.verifyResponse(ch, task.answer);
  assert.ok(['continue','accepted'].includes(res.status));
}

function testRenderPrompt() {
  const ch = challenges.generateChallenge('nested_captcha');
  const prompt = challenges.renderPrompt(ch);
  assert.ok(typeof prompt === 'string' && prompt.length > 0);
}

function run() {
  testRiddle();
  testMicrotask();
  testRenderPrompt();
  console.log('All challenge tests passed.');
}

run();
