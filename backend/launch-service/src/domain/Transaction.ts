import { Money } from './Money.js';
import { TransactionType } from './TransactionType.js';
import { v4 as uuidv4 } from 'uuid';

export class Transaction {
  private readonly id: string;
  private readonly merchantId: string;
  private readonly type: TransactionType;
  private readonly amount: Money;
  private readonly description: string;
  private readonly createdAt: Date;

  constructor(
    id: string,
    merchantId: string,
    type: TransactionType,
    amount: Money,
    description: string,
    createdAt: Date = new Date()
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Transaction ID is required.');
    }
    if (!merchantId || merchantId.trim().length === 0) {
      throw new Error('Merchant ID is required.');
    }
    if (!Object.values(TransactionType).includes(type)) {
      throw new Error(`Invalid transaction type: ${type}`);
    }
    if (amount.getAmountInCents() <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    this.id = id;
    this.merchantId = merchantId;
    this.type = type;
    this.amount = amount;
    this.description = description || '';
    this.createdAt = createdAt;
  }

  public static create(
    merchantId: string,
    type: TransactionType,
    amount: Money,
    description: string
  ): Transaction {
    const id = uuidv4();
    return new Transaction(id, merchantId, type, amount, description, new Date());
  }

  public getId(): string {
    return this.id;
  }

  public getMerchantId(): string {
    return this.merchantId;
  }

  public getType(): TransactionType {
    return this.type;
  }

  public getAmount(): Money {
    return this.amount;
  }

  public getDescription(): string {
    return this.description;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }
}
