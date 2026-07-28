import { Transaction } from '../domain/Transaction.js';
import { ITransactionRepository } from '../domain/ITransactionRepository.js';

export class ListTransactionsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  public async execute(merchantId: string, limit: number = 50): Promise<Transaction[]> {
    if (!merchantId) {
      throw new Error('Merchant ID is required.');
    }
    return this.transactionRepository.findByMerchantId(merchantId, limit);
  }
}
