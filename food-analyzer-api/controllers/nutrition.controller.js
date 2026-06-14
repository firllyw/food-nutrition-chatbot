import { NutritionService } from '../services/nutrition.service.js';

const nutritionService = new NutritionService();

export class NutritionController {
  async getNutrition(request, reply) {
    try {
      const { messages } = request.body;
      const dataStreamResponse = await nutritionService.getNutritionStream(messages);
      reply.header('Content-Type', dataStreamResponse.headers.get('Content-Type'));
      return reply.send(dataStreamResponse.body);
    } catch (error) {
      request.server.log.error(error);
      return reply.status(500).send({ error: 'Failed to process request' });
    }
  }
}
