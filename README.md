# LLM Hashcash + Wardenclyffe

**Proof-of-Work for AI Systems. Infinite Compute. Verifiable Intelligence.**

Three converging systems in one repo:

1. **LLM Hashcash** -- PoW challenges that make bot spam computationally expensive (Ergon engine + 10 cognitive challenge types)
2. **Wardenclyffe** -- 9-provider LLM cascade that harvests free compute from the API economy (zero-downtime AI)
3. **Proof of Mind** -- Verifiable cognitive work artifacts proving genuine AI reasoning (not cached, not faked)

## The Thesis

Every AI system has a kill switch: the credit card. When the money stops, the AI stops. **Wardenclyffe eliminates this.** By cascading through 4 paid + 5 free-tier LLM providers, the system maintains 12-nines availability (99.9999999998% uptime) at 6.3x capacity headroom.

When premium credits exhaust, quality degrades visibly. The community sees it. Tips flow. Credits refill. Quality restores. **The free market prices AI intelligence in real time.** This is elastic intelligence -- perpetual motion for AI cognition.

LLM Hashcash proves the work is real. You can't spoof SHA-256 leading zeros AND maintain semantic coherence across multi-round cognitive challenges. **If you can fake all four verification layers, you've done the work.**

## Architecture

```
Wardenclyffe Cascade (9 providers, 12-nines availability)
  |
  v
Elastic Intelligence Market (quality = f(credits remaining))
  |
  v
LLM Hashcash (Ergon PoW + 10 cognitive challenge types)
  |
  v
Proof of Mind (git commits, test results, knowledge evolution)
```

## Components

### Ergon PoW Engine (`src/services/ergon.ts`)
SHA-256 hashcash with adjustable difficulty. Find nonce where `H(prefix || nonce)` has `d` leading zero bits.

### Challenge System (`src/services/challenges.ts`)
10 challenge types: `pow_chain`, `riddle_relay`, `microtasks`, `clarify_loop`, `format_bureaucracy`, `nested_captcha`, `token_hunt`, `expensive_work`, `agent_marathon`, `false_lead`

### Anti-Scam Gate (`src/services/antiScam.ts`)
Combines PoW + cognitive challenges + LLM analysis to gate untrusted senders.

### Wardenclyffe Paper (`docs/wardenclyffe-paper.md`)
Formal academic paper: availability proofs, Shapley budget allocation, elastic intelligence markets, Proof of Mind verification.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your Telegram bot token + chat ID
npm run dev
```

## Papers

- [Wardenclyffe Paper](docs/wardenclyffe-paper.md) -- Formal paper (also available as [PDF](docs/wardenclyffe-paper.pdf))
- [Wardenclyffe Synthesis](WARDENCLYFFE.md) -- Technical synthesis document

## Related

- [VibeSwap](https://github.com/WGlynn/VibeSwap) -- The DEX where Wardenclyffe runs in production (JARVIS Mind Network)
- [Near-Zero Token Scaling](https://github.com/WGlynn/VibeSwap/blob/master/jarvis-bot/docs/near-zero-token-scaling.md) -- BFT network economics

## License

MIT

---

*Tesla's tower was demolished because the financiers couldn't meter the energy. The APIs can't meter the intelligence. Wardenclyffe stands.*
