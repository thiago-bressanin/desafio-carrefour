import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { initPostgres } from './infrastructure/database/postgres.js';

const PORT = process.env.PORT || 3001;
const useInMemory = process.env.USE_IN_MEMORY === 'true';

async function bootstrap() {
  if (!useInMemory) {
    try {
      await initPostgres();
    } catch (err) {
      console.warn('[LaunchService] Warning: PostgreSQL connect failed. Falling back to in-memory store if needed.');
    }
  }

  const app = createApp(useInMemory);
  app.listen(PORT, () => {
    console.log(`[LaunchService] Cash Flow Launch Service running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => console.error('LaunchService bootstrap failed:', err));
