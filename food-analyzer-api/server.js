import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';

import { nutritionRoute } from './routes/nutrition.route.js';

const fastify = Fastify({ 
  logger: true,
  bodyLimit: 5242880 // 5MB limit
});

fastify.register(cors, {
  origin: '*',
});

fastify.register(nutritionRoute);

const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port: port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
