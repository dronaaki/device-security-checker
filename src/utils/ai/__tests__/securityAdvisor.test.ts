import { getAIRecommendations, parseRecommendations } from '../securityAdvisor';

describe('parseRecommendations', () => {
  const valid = JSON.stringify({
    recommendations: [
      { title: 'Enable screen lock', detail: 'No screen lock detected.', priority: 'high' },
    ],
  });

  it('parses a clean JSON response', () => {
    const result = parseRecommendations(valid);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Enable screen lock');
    expect(result[0].priority).toBe('high');
    expect(result[0].id).toBe('ai-rec-0');
  });

  it('strips markdown code fences', () => {
    expect(parseRecommendations('```json\n' + valid + '\n```')).toHaveLength(1);
  });

  it('ignores prose surrounding the JSON object', () => {
    expect(parseRecommendations(`Here you go:\n${valid}\nHope that helps!`)).toHaveLength(1);
  });

  it('defaults an unrecognised priority to medium', () => {
    const text = JSON.stringify({
      recommendations: [{ title: 'A', detail: 'B', priority: 'urgent' }],
    });
    expect(parseRecommendations(text)[0].priority).toBe('medium');
  });

  it('drops malformed entries but keeps valid ones', () => {
    const text = JSON.stringify({
      recommendations: [{ title: 'Good', detail: 'Fine' }, { title: 'No detail' }, null],
    });
    const result = parseRecommendations(text);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Good');
  });

  it('caps the list at five recommendations', () => {
    const text = JSON.stringify({
      recommendations: Array.from({ length: 9 }, (_, i) => ({
        title: `T${i}`,
        detail: 'D',
        priority: 'low',
      })),
    });
    expect(parseRecommendations(text)).toHaveLength(5);
  });

  it('accepts an empty recommendation list', () => {
    expect(parseRecommendations('{"recommendations":[]}')).toEqual([]);
  });

  it('throws when the response contains no JSON object', () => {
    expect(() => parseRecommendations('I cannot help with that.')).toThrow(/No JSON object/);
  });

  it('throws when the recommendations key is missing', () => {
    expect(() => parseRecommendations('{"results":[]}')).toThrow(/recommendations/);
  });
});

describe('getAIRecommendations', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.EXPO_PUBLIC_AI_PROVIDER;
  });

  it('gives up on a provider that never responds', async () => {
    // Ollama needs no API key, so this exercises the request path without one.
    process.env.EXPO_PUBLIC_AI_PROVIDER = 'ollama';

    // A fetch that only settles when aborted — i.e. a hung provider.
    globalThis.fetch = jest.fn(
      (_url, init: any) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        })
    ) as unknown as typeof fetch;

    await expect(getAIRecommendations([], { timeoutMs: 20 })).rejects.toThrow(
      /did not respond within/
    );
  });
});
