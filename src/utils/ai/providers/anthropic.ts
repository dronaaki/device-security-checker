import {
  AIProvider,
  AIProviderConfig,
  DEFAULT_MAX_TOKENS,
  fetchWithContext,
  readErrorBody,
} from '../types';

const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_BASE_URL = 'https://api.anthropic.com/v1';

/**
 * Anthropic's Messages API differs from the OpenAI-compatible hosts in two
 * ways, so it needs its own adapter: auth is an `x-api-key` header rather than
 * a bearer token, and the system prompt is a top-level field rather than a
 * message with role 'system'.
 */
export function createAnthropicProvider(config: AIProviderConfig): AIProvider {
  return {
    id: 'anthropic',
    label: 'Anthropic',
    requiresApiKey: true,

    async complete(request) {
      const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

      const system = request.messages
        .filter((message) => message.role === 'system')
        .map((message) => message.content)
        .join('\n\n');
      const messages = request.messages.filter((message) => message.role !== 'system');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'anthropic-version': ANTHROPIC_VERSION,
      };
      // Left unset when a proxy attaches the key server-side.
      if (config.apiKey) {
        headers['x-api-key'] = config.apiKey;
      }

      const response = await fetchWithContext(
        `${baseUrl}/messages`,
        {
          method: 'POST',
          headers,
          signal: request.signal,
          body: JSON.stringify({
            model: config.model,
            max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
            ...(system ? { system } : {}),
            messages,
          }),
        },
        'Anthropic'
      );

      if (!response.ok) {
        throw new Error(
          `Anthropic request failed (${response.status}): ${await readErrorBody(response)}`
        );
      }

      const data = await response.json();
      const text = data?.content?.find(
        (block: { type?: string }) => block?.type === 'text'
      )?.text;
      if (typeof text !== 'string') {
        throw new Error('Anthropic returned no text content');
      }

      return { text, model: data?.model ?? config.model };
    },
  };
}
