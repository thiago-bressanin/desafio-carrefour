import { ITransactionRepository } from '../../domain/ITransactionRepository.js';
import { Transaction } from '../../domain/Transaction.js';
import { TransactionType } from '../../domain/TransactionType.js';
import { Money } from '../../domain/Money.js';
import { pool } from '../database/postgres.js';

export class PostgresTransactionRepository implements ITransactionRepository {
  public async save(transaction: Transaction): Promise<void> {
    const query = `
      INSERT INTO transactions (id, merchant_id, type, amount_in_cents, currency, description, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [
      transaction.getId(),
      transaction.getMerchantId(),
      transaction.getType(),
      transaction.getAmount().getAmountInCents(),
      transaction.getAmount().getCurrency(),
      transaction.getDescription(),
      transaction.getCreatedAt()
    ];
    await pool.query(query, values);
  }

  public async findById(id: string): Promise<Transaction | null> {
    const query = `SELECT * FROM transactions WHERE id = $1`;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    return this.mapToDomain(res.rows[0]);
  }

  public async findByMerchantId(merchantId: string, limit: number = 50): Promise<Transaction[]> {
    const query = `
      SELECT * FROM transactions
      WHERE merchant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const res = await pool.query(query, [merchantId, limit]);
    return res.rows.map((row) => this.mapToDomain(row));
  }

  private mapToDomain(row: any): Transaction {
    const typeEnum = row.type === 'CREDIT' ? TransactionType.CREDIT : TransactionType.DEBIT;
    const money = new Money(row.amount_in_cents, row.currency);
    return new Transaction(
      row.id,
      row.merchant_id,
      typeEnum,
      money,
      row.description,
      new Date(row.created_at)
    );
  }
}
