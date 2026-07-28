import { ITransactionRepository } from '../../domain/ITransactionRepository.js';
import { Transaction } from '../../domain/Transaction.js';

export class InMemoryTransactionRepository implements ITransactionRepository {
  private transactions: Map<string, Transaction> = new Map();

  public async save(transaction: Transaction): Promise<void> {
    this.transactions.set(transaction.getId(), transaction);
  }

  public async findById(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) || null;
  }

  public async findByMerchantId(merchantId: string, limit: number = 50): Promise<Transaction[]> {
    const results: Transaction[] = [];
    for (const tx of this.transactions.values()) {
      if (tx.getMerchantId() === merchantId) {
        results.push(tx);
      }
    }
    return results
      .sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime())
      .slice(0, limit);
  }
}
