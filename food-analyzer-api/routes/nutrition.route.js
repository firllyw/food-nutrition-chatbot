import { NutritionController } from '../controllers/nutrition.controller.js';

const nutritionController = new NutritionController();

export async function nutritionRoute(fastify, options) {
  fastify.post('/api/get-nutrition', nutritionController.getNutrition.bind(nutritionController));
}
