export type AIRole = 'system' | 'user' | 'assistant';

export interface AIMessage {
  role: AIRole;
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AICompletionResponse {
  text: string;
  model: string;
}

export interface AIProviderConfig {
  /** Provider-specific model id, e.g. 'claude-opus-4-8' or 'llama3.2'. */
  model: string;
  /** Overrides the provider's default endpoint — set this to point at a proxy. */
  baseUrl?: string;
  /** Omit for providers that don't authenticate (Ollama), or when a proxy adds the key. */
  apiKey?: string;
}

export interface AIProvider {
  readonly id: string;
  readonly label: string;
  /** False for local providers like Ollama, so callers can skip the key check. */
  readonly requiresApiKey: boolean;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
}

export type AIProviderFactory = (config: AIProviderConfig) => AIProvider;

/**
 * Responses here are short structured JSON, so a small cap keeps latency down.
 * Raise it if a provider starts truncating mid-object.
 */
export const DEFAULT_MAX_TOKENS = 2048;

/** Reads an error body without masking the original failure if that also throws. */
export async function readErrorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return '<unreadable response body>';
  }
}

/**
 * fetch() rejects with a bare "Failed to fetch" for every transport problem,
 * which gives the user nothing to act on. Name the host we couldn't reach, and
 * call out CORS for local providers — on web that's the usual cause once the
 * server is actually running.
 */
export async function fetchWithContext(
  url: string,
  init: RequestInit,
  label: string
): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    const isLocal = /localhost|127\.0\.0\.1/.test(url);
    const hint = isLocal
      ? ' Check it is running, and that it allows requests from this origin (for Ollama, set OLLAMA_ORIGINS).'
      : ' Check the URL and your network connection.';
    throw new Error(`Could not reach ${label} at ${url}.${hint}`);
  }
}
