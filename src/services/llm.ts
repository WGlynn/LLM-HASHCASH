import axios from 'axios';

export async function summarizeWithLLM(text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: simple heuristic summary
    const shortened = text.length > 200 ? text.slice(0, 197) + '...' : text;
    return `Summary (fallback): ${shortened}`;
  }

  try {
    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a concise summarizer.' },
          { role: 'user', content: `Summarize the following message in one short sentence: ${text}` },
        ],
        max_tokens: 120,
        temperature: 0.2,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );
    const choice = resp.data?.choices?.[0]?.message?.content;
    if (choice) return `Summary: ${choice.trim()}`;
  } catch (e) {
    // swallow and fallback
  }
  const shortened = text.length > 200 ? text.slice(0, 197) + '...' : text;
  return `Summary (fallback): ${shortened}`;
}

export default { summarizeWithLLM };
