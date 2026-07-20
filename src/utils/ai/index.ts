import { createAnthropicProvider } from './providers/anthropic';
import { createOpenAICompatibleProvider } from './providers/openai-compatible';
import { AIProvider, AIProviderConfig, AIProviderFactory } from './types';

export * from './types';

/**
 * To add a provider: if it speaks the OpenAI /chat/completions contract, add a
 * createOpenAICompatibleProvider entry here and nothing else changes. If it
 * doesn't, write an adapter satisfying AIProvider like ./providers/anthropic.
 */
export const AI_PROVIDERS: Record<string, AIProviderFactory> = {
  anthropic: createAnthropicProvider,

  openrouter: createOpenAICompatibleProvider({
    id: 'openrouter',
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
  }),

  // Local by default, so this is the one provider that needs no key.
  ollama: createOpenAICompatibleProvider({
    id: 'ollama',
    label: 'Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
    requiresApiKey: false,
  }),

  huggingface: createOpenAICompatibleProvider({
    id: 'huggingface',
    label: 'Hugging Face',
    defaultBaseUrl: 'https://router.huggingface.co/v1',
    requiresApiKey: true,
  }),
};

export type AIProviderId = keyof typeof AI_PROVIDERS;

/** Sensible model per provider when EXPO_PUBLIC_AI_MODEL isn't set. */
const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-opus-4-8',
  openrouter: 'anthropic/claude-opus-4-8',
  ollama: 'llama3.2',
  huggingface: 'meta-llama/Llama-3.1-8B-Instruct',
};

export class AIConfigError extends Error {}

/**
 * Builds the configured provider from environment.
 *
 * SECURITY: EXPO_PUBLIC_* variables are inlined into the JS bundle at build
 * time — they are readable by anyone with the app or the web page. Only put a
 * real API key here for local development. In production, leave the key unset
 * and point EXPO_PUBLIC_AI_BASE_URL at a backend that attaches the key itself.
 * Ollama needs no key at all, so it's the safe default.
 */
export function createConfiguredProvider(): AIProvider {
  const id = process.env.EXPO_PUBLIC_AI_PROVIDER ?? 'ollama';
  const factory = AI_PROVIDERS[id];

  if (!factory) {
    throw new AIConfigError(
      `Unknown AI provider "${id}". Set EXPO_PUBLIC_AI_PROVIDER to one of: ${Object.keys(AI_PROVIDERS).join(', ')}.`
    );
  }

  const config: AIProviderConfig = {
    model: process.env.EXPO_PUBLIC_AI_MODEL ?? DEFAULT_MODELS[id],
    baseUrl: process.env.EXPO_PUBLIC_AI_BASE_URL || undefined,
    apiKey: process.env.EXPO_PUBLIC_AI_API_KEY || undefined,
  };

  const provider = factory(config);

  // A proxy supplies the key server-side, so only complain when talking direct.
  const usingProxy = Boolean(config.baseUrl);
  if (provider.requiresApiKey && !config.apiKey && !usingProxy) {
    throw new AIConfigError(
      `${provider.label} needs an API key. Set EXPO_PUBLIC_AI_API_KEY for local testing, or point EXPO_PUBLIC_AI_BASE_URL at a backend that adds it.`
    );
  }

  return provider;
}
