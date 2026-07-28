import { Router } from 'express';
import { ConsolidationController } from './ConsolidationController.js';

export function createConsolidationRouter(controller: ConsolidationController): Router {
  const router = Router();

  router.get('/consolidation/daily', controller.getDailyConsolidation);
  router.get('/consolidation/daily/:merchantId', controller.getDailyConsolidation);
  router.post('/consolidation/rebuild', controller.rebuild);

  return router;
}
