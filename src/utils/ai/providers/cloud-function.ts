import { AIProvider, AIProviderConfig } from '../types';
import app from '../../firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';

export function createCloudFunctionProvider(): (config: AIProviderConfig) => AIProvider {
  return (config: AIProviderConfig): AIProvider => ({
    id: 'cloud-function',
    label: 'Cloud Function Backend',
    requiresApiKey: false,
    async complete(request) {
      const functions = getFunctions(app);
      const chatWithAI = httpsCallable(functions, 'chatWithAI');
      
      const response = await chatWithAI({
        testMessages: request.messages
      });
      
      return { text: (response.data as any).text, model: config.model || 'cloud' };
    }
  });
}
