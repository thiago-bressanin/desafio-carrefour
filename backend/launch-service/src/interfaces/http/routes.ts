import { Router } from 'express';
import { TransactionController } from './TransactionController.js';

export function createTransactionRouter(controller: TransactionController): Router {
  const router = Router();

  router.post('/transactions', controller.create);
  router.get('/transactions/:merchantId', controller.listByMerchant);
  router.get('/transactions', controller.listByMerchant);

  return router;
}
