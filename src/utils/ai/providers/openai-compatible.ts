import {
  AIProvider,
  AIProviderConfig,
  DEFAULT_MAX_TOKENS,
  fetchWithContext,
  readErrorBody,
} from '../types';

interface OpenAICompatibleOptions {
  id: string;
  label: string;
  /** Must already include the version segment, e.g. '.../v1' — '/chat/completions' is appended. */
  defaultBaseUrl: string;
  requiresApiKey: boolean;
  /** Headers a specific host wants on top of auth (e.g. OpenRouter attribution). */
  extraHeaders?: Record<string, string>;
}

/**
 * OpenRouter, Ollama and Hugging Face all expose the same OpenAI-style
 * /chat/completions contract, so they share one implementation and differ only
 * by base URL and auth. Adding another OpenAI-compatible host is one call.
 */
export function createOpenAICompatibleProvider(options: OpenAICompatibleOptions) {
  return (config: AIProviderConfig): AIProvider => ({
    id: options.id,
    label: options.label,
    requiresApiKey: options.requiresApiKey,

    async complete(request) {
      const baseUrl = (config.baseUrl ?? options.defaultBaseUrl).replace(/\/+$/, '');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.extraHeaders,
      };
      if (config.apiKey) {
        headers.Authorization = `Bearer ${config.apiKey}`;
      }

      const url = `${baseUrl}/chat/completions`;
      const response = await fetchWithContext(
        url,
        {
          method: 'POST',
          headers,
          signal: request.signal,
          body: JSON.stringify({
            model: config.model,
            messages: request.messages,
            max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
          }),
        },
        options.label
      );

      if (!response.ok) {
        throw new Error(
          `${options.label} request failed (${response.status}): ${await readErrorBody(response)}`
        );
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== 'string') {
        throw new Error(`${options.label} returned no message content`);
      }

      return { text, model: data?.model ?? config.model };
    },
  });
}
