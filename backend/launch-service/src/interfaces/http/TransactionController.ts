import { Request, Response } from 'express';
import { CreateTransactionUseCase } from '../../application/CreateTransactionUseCase.js';
import { ListTransactionsUseCase } from '../../application/ListTransactionsUseCase.js';
import { z } from 'zod';

const createTransactionSchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  type: z.enum(['CREDIT', 'DEBIT']),
  amount: z.number().positive('amount must be greater than zero'),
  currency: z.string().optional().default('BRL'),
  description: z.string().optional().default('')
});

export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase
  ) {}

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validated = createTransactionSchema.parse(req.body);
      const transaction = await this.createTransactionUseCase.execute(validated);

      res.status(201).json({
        success: true,
        data: {
          id: transaction.getId(),
          merchantId: transaction.getMerchantId(),
          type: transaction.getType(),
          amount: transaction.getAmount().getAmount(),
          amountInCents: transaction.getAmount().getAmountInCents(),
          currency: transaction.getAmount().getCurrency(),
          description: transaction.getDescription(),
          createdAt: transaction.getCreatedAt().toISOString()
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error.errors });
        return;
      }
      res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
  };

  public listByMerchant = async (req: Request, res: Response): Promise<void> => {
    try {
      const merchantId = req.params.merchantId || (req.query.merchantId as string);
      const limit = parseInt(req.query.limit as string, 10) || 50;

      if (!merchantId) {
        res.status(400).json({ success: false, error: 'merchantId parameter is required' });
        return;
      }

      const transactions = await this.listTransactionsUseCase.execute(merchantId, limit);

      res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions.map((t) => ({
          id: t.getId(),
          merchantId: t.getMerchantId(),
          type: t.getType(),
          amount: t.getAmount().getAmount(),
          amountInCents: t.getAmount().getAmountInCents(),
          currency: t.getAmount().getCurrency(),
          description: t.getDescription(),
          createdAt: t.getCreatedAt().toISOString()
        }))
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
  };
}
