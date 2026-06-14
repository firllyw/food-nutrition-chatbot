import { streamText, convertToCoreMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { SYSTEM_INSTRUCTION } from '../utils/constants.js';

export class NutritionService {
  async getNutritionStream(messages) {
    const coreMessages = messages.map(m => {
      const parts = [{ type: 'text', text: m.content }];
      if (m.annotations) {
        for (const ann of m.annotations) {
          if (ann.type === 'image' && ann.url) {
            parts.push({ type: 'image', image: ann.url });
          }
        }
      }
      return { role: m.role, content: parts };
    });

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: SYSTEM_INSTRUCTION,
      messages: coreMessages,
    });

    return result.toDataStreamResponse();
  }
}
