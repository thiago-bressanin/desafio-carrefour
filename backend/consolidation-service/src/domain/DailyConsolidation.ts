export class DailyConsolidation {
  private readonly merchantId: string;
  private readonly date: string; // YYYY-MM-DD
  private totalCreditsInCents: number;
  private totalDebitsInCents: number;
  private netBalanceInCents: number;
  private transactionCount: number;
  private updatedAt: Date;

  constructor(
    merchantId: string,
    date: string,
    totalCreditsInCents: number = 0,
    totalDebitsInCents: number = 0,
    netBalanceInCents: number = 0,
    transactionCount: number = 0,
    updatedAt: Date = new Date()
  ) {
    if (!merchantId) throw new Error('Merchant ID is required.');
    if (!date) throw new Error('Date (YYYY-MM-DD) is required.');

    this.merchantId = merchantId;
    this.date = date;
    this.totalCreditsInCents = totalCreditsInCents;
    this.totalDebitsInCents = totalDebitsInCents;
    this.netBalanceInCents = netBalanceInCents;
    this.transactionCount = transactionCount;
    this.updatedAt = updatedAt;
  }

  public static createEmpty(merchantId: string, date: string): DailyConsolidation {
    return new DailyConsolidation(merchantId, date, 0, 0, 0, 0, new Date());
  }

  public applyTransaction(type: 'CREDIT' | 'DEBIT', amountInCents: number): void {
    if (amountInCents <= 0) {
      throw new Error('Amount in cents must be positive.');
    }

    if (type === 'CREDIT') {
      this.totalCreditsInCents += amountInCents;
    } else if (type === 'DEBIT') {
      this.totalDebitsInCents += amountInCents;
    } else {
      throw new Error(`Unknown transaction type: ${type}`);
    }

    this.netBalanceInCents = this.totalCreditsInCents - this.totalDebitsInCents;
    this.transactionCount += 1;
    this.updatedAt = new Date();
  }

  public getMerchantId(): string {
    return this.merchantId;
  }

  public getDate(): string {
    return this.date;
  }

  public getTotalCreditsInCents(): number {
    return this.totalCreditsInCents;
  }

  public getTotalCredits(): number {
    return this.totalCreditsInCents / 100;
  }

  public getTotalDebitsInCents(): number {
    return this.totalDebitsInCents;
  }

  public getTotalDebits(): number {
    return this.totalDebitsInCents / 100;
  }

  public getNetBalanceInCents(): number {
    return this.netBalanceInCents;
  }

  public getNetBalance(): number {
    return this.netBalanceInCents / 100;
  }

  public getTransactionCount(): number {
    return this.transactionCount;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
