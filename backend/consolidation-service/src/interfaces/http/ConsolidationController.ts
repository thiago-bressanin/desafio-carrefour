import { Request, Response } from 'express';
import { GetConsolidatedBalanceUseCase } from '../../application/GetConsolidatedBalanceUseCase.js';
import { RebuildConsolidationUseCase } from '../../application/RebuildConsolidationUseCase.js';
import { z } from 'zod';

const getConsolidationQuerySchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format').optional()
});

export class ConsolidationController {
  constructor(
    private readonly getConsolidatedBalanceUseCase: GetConsolidatedBalanceUseCase,
    private readonly rebuildConsolidationUseCase: RebuildConsolidationUseCase
  ) {}

  public getDailyConsolidation = async (req: Request, res: Response): Promise<void> => {
    try {
      const merchantId = (req.query.merchantId as string) || req.params.merchantId;
      const today = new Date().toISOString().substring(0, 10);
      const date = (req.query.date as string) || today;

      const validated = getConsolidationQuerySchema.parse({ merchantId, date });
      const result = await this.getConsolidatedBalanceUseCase.execute(validated.merchantId, validated.date!);

      res.setHeader('X-Cache-Source', result.source);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error.errors });
        return;
      }
      res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
  };

  public rebuild = async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantId, date, transactions } = req.body;
      if (!merchantId || !date || !Array.isArray(transactions)) {
        res.status(400).json({ success: false, error: 'merchantId, date and transactions array required' });
        return;
      }

      const consolidation = await this.rebuildConsolidationUseCase.execute(merchantId, date, transactions);

      res.status(200).json({
        success: true,
        data: {
          merchantId: consolidation.getMerchantId(),
          date: consolidation.getDate(),
          totalCredits: consolidation.getTotalCredits(),
          totalDebits: consolidation.getTotalDebits(),
          netBalance: consolidation.getNetBalance(),
          transactionCount: consolidation.getTransactionCount()
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
