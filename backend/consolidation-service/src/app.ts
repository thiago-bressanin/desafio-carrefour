import express, { Express } from 'express';
import cors from 'cors';
import { IConsolidationRepository } from './domain/IConsolidationRepository.js';
import { MongoConsolidationRepository } from './infrastructure/repositories/MongoConsolidationRepository.js';
import { InMemoryConsolidationRepository } from './infrastructure/repositories/InMemoryConsolidationRepository.js';
import { ICacheService } from './domain/ICacheService.js';
import { RedisCacheService } from './infrastructure/cache/RedisCacheService.js';
import { InMemoryCacheService } from './infrastructure/cache/InMemoryCacheService.js';
import { GetConsolidatedBalanceUseCase } from './application/GetConsolidatedBalanceUseCase.js';
import { ProcessTransactionEventUseCase } from './application/ProcessTransactionEventUseCase.js';
import { RebuildConsolidationUseCase } from './application/RebuildConsolidationUseCase.js';
import { ConsolidationController } from './interfaces/http/ConsolidationController.js';
import { createConsolidationRouter } from './interfaces/http/routes.js';

export function createApp(useInMemory: boolean = false): { app: Express; processEventUseCase: ProcessTransactionEventUseCase } {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const repo: IConsolidationRepository = useInMemory
    ? new InMemoryConsolidationRepository()
    : new MongoConsolidationRepository();

  const cacheService: ICacheService = useInMemory
    ? new InMemoryCacheService()
    : new RedisCacheService();

  const getUseCase = new GetConsolidatedBalanceUseCase(repo, cacheService);
  const processEventUseCase = new ProcessTransactionEventUseCase(repo, cacheService);
  const rebuildUseCase = new RebuildConsolidationUseCase(repo, cacheService);
  const controller = new ConsolidationController(getUseCase, rebuildUseCase);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'UP', service: 'consolidation-service', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1', createConsolidationRouter(controller));

  return { app, processEventUseCase };
}
