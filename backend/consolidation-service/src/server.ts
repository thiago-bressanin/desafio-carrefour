import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { initMongo } from './infrastructure/database/mongodb.js';
import { RedisEventConsumerWorker } from './infrastructure/events/RedisEventConsumerWorker.js';

const PORT = process.env.PORT || 3002;
const useInMemory = process.env.USE_IN_MEMORY === 'true';

async function bootstrap() {
  if (!useInMemory) {
    try {
      await initMongo();
    } catch (err) {
      console.warn('[ConsolidationService] Warning: MongoDB connect failed. Running with repository fallbacks.');
    }
  }

  const { app, processEventUseCase } = createApp(useInMemory);

  // Initialize Redis Event Consumer Worker
  new RedisEventConsumerWorker(processEventUseCase);

  app.listen(PORT, () => {
    console.log(`[ConsolidationService] Daily Consolidation Service running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => console.error('ConsolidationService bootstrap failed:', err));
