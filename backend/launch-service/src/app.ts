import express, { Express } from 'express';
import cors from 'cors';
import { ITransactionRepository } from './domain/ITransactionRepository.js';
import { PostgresTransactionRepository } from './infrastructure/repositories/PostgresTransactionRepository.js';
import { InMemoryTransactionRepository } from './infrastructure/repositories/InMemoryTransactionRepository.js';
import { RedisEventPublisher } from './infrastructure/events/RedisEventPublisher.js';
import { CreateTransactionUseCase } from './application/CreateTransactionUseCase.js';
import { ListTransactionsUseCase } from './application/ListTransactionsUseCase.js';
import { TransactionController } from './interfaces/http/TransactionController.js';
import { createTransactionRouter } from './interfaces/http/routes.js';

export function createApp(useInMemory: boolean = false): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const repo: ITransactionRepository = useInMemory
    ? new InMemoryTransactionRepository()
    : new PostgresTransactionRepository();

  const eventPublisher = new RedisEventPublisher();
  const createUseCase = new CreateTransactionUseCase(repo, eventPublisher);
  const listUseCase = new ListTransactionsUseCase(repo);
  const controller = new TransactionController(createUseCase, listUseCase);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'UP', service: 'launch-service', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1', createTransactionRouter(controller));

  return app;
}
