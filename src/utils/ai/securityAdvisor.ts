import { SecurityCheckResult } from '../securityChecks';
import { createConfiguredProvider } from './index';
import { AIMessage } from './types';

export interface AIRecommendation {
  id: string;
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

const PRIORITIES = ['high', 'medium', 'low'] as const;

// The 'info' rule is the important one: these checks genuinely could not be
// determined, and a security app that guesses either way is worse than one that
// says "unknown". Everything else guards against invented findings.
const SYSTEM_PROMPT = `You are a security advisor inside a device-security app. You are given the results of automated checks run on the user's own device. Explain what they mean and what the user should actually do.

Rules:
- A check with status "info" could NOT be determined. Never present it as safe or as a problem. If it matters, tell the user how to verify it themselves.
- Only reason from the checks provided. Do not invent findings, and do not claim to know anything about the device that isn't in the input.
- Order by real-world risk to this user, not by the order the checks appear in.
- Prefer one concrete action the user can take over general advice.
- Return 1 to 5 recommendations. If nothing is worth acting on, return an empty list.

Respond with JSON only. No prose, no markdown code fences. Shape:
{"recommendations":[{"title":"short label","detail":"one or two sentences","priority":"high"|"medium"|"low"}]}`;

function buildMessages(checks: SecurityCheckResult[]): AIMessage[] {
  const summary = checks
    .map((check) => `- ${check.name} [${check.status}]: ${check.message}`)
    .join('\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Device check results:\n\n${summary}` },
  ];
}

/**
 * Models ignore "no code fences" often enough that stripping them is cheaper
 * than retrying, and some prepend a sentence before the JSON.
 */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in model response');
  }
  return candidate.slice(start, end + 1);
}

export function parseRecommendations(text: string): AIRecommendation[] {
  const parsed = JSON.parse(extractJson(text));
  const raw = parsed?.recommendations;

  if (!Array.isArray(raw)) {
    throw new Error('Model response had no "recommendations" array');
  }

  // Drop malformed entries rather than failing the whole batch — a partially
  // useful list beats an error screen.
  return raw
    .filter(
      (item): item is { title: string; detail: string; priority?: string } =>
        typeof item?.title === 'string' && typeof item?.detail === 'string'
    )
    .map((item, index) => ({
      id: `ai-rec-${index}`,
      title: item.title,
      detail: item.detail,
      priority: (PRIORITIES as readonly string[]).includes(item.priority ?? '')
        ? (item.priority as AIRecommendation['priority'])
        : 'medium',
    }))
    .slice(0, 5);
}

/**
 * Generous enough for a local model on modest hardware to finish a short
 * response, but bounded — fetch() has no timeout of its own, so without this a
 * hung provider leaves the caller waiting forever with no way to recover.
 */
export const DEFAULT_TIMEOUT_MS = 60_000;

export interface AIRecommendationOptions {
  /** Caller-owned cancellation, e.g. the user navigating away mid-request. */
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function getAIRecommendations(
  checks: SecurityCheckResult[],
  options: AIRecommendationOptions = {}
): Promise<AIRecommendation[]> {
  const { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort);

  try {
    const provider = createConfiguredProvider();
    const response = await provider.complete({
      messages: buildMessages(checks),
      signal: controller.signal,
    });
    return parseRecommendations(response.text);
  } catch (error) {
    // Distinguish our deadline from the caller cancelling, so the user sees
    // "it timed out" rather than a bare AbortError they can't act on.
    if (controller.signal.aborted && !signal?.aborted) {
      throw new Error(
        `The AI provider did not respond within ${Math.round(timeoutMs / 1000)}s.`
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
