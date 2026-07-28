import { Transaction } from './Transaction.js';

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByMerchantId(merchantId: string, limit?: number): Promise<Transaction[]>;
}
