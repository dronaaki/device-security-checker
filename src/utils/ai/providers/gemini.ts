import {
  AIProvider,
  AIProviderConfig,
  fetchWithContext,
  readErrorBody,
} from '../types';

export function createGeminiProvider(config: AIProviderConfig): AIProvider {
  return {
    id: 'gemini',
    label: 'Google Gemini',
    requiresApiKey: true,

    async complete(request) {
      if (!config.apiKey) {
        throw new Error('Gemini requires an API key.');
      }

      const rawModel = config.model || 'gemini-1.5-flash';
      const cleanModel = rawModel.replace(/^models\//, '').trim();
      const baseUrl = config.baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;
      const url = `${baseUrl}?key=${config.apiKey}`;

      // Gemini separates system prompt from messages
      let systemPromptText = '';
      const geminiMessages = [];

      for (const msg of request.messages) {
        if (msg.role === 'system') {
          systemPromptText += msg.content + '\n';
        } else {
          geminiMessages.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }

      const payload: any = {
        contents: geminiMessages
      };

      if (systemPromptText) {
        payload.systemInstruction = {
          parts: [{ text: systemPromptText.trim() }]
        };
      }

      const response = await fetchWithContext(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: request.signal,
          body: JSON.stringify(payload),
        },
        'Google Gemini'
      );

      if (!response.ok) {
        throw new Error(
          `Google Gemini request failed (${response.status}): ${await readErrorBody(response)}`
        );
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (typeof text !== 'string') {
        throw new Error(`Google Gemini returned no message content: ${JSON.stringify(data)}`);
      }

      return { text, model };
    },
  };
}
