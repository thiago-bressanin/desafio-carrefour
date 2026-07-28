export class Money {
  private readonly amountInCents: number;
  private readonly currency: string;

  constructor(amountInCents: number, currency: string = 'BRL') {
    if (!Number.isInteger(amountInCents) || amountInCents < 0) {
      throw new Error('Money amount must be a non-negative integer representing cents.');
    }
    this.amountInCents = amountInCents;
    this.currency = currency.toUpperCase();
  }

  public static fromDecimal(amount: number, currency: string = 'BRL'): Money {
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      throw new Error('Decimal amount must be a non-negative number.');
    }
    const cents = Math.round(amount * 100);
    return new Money(cents, currency);
  }

  public getAmountInCents(): number {
    return this.amountInCents;
  }

  public getAmount(): number {
    return this.amountInCents / 100;
  }

  public getCurrency(): string {
    return this.currency;
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amountInCents + other.getAmountInCents(), this.currency);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amountInCents - other.getAmountInCents();
    if (result < 0) {
      throw new Error('Resulting Money amount cannot be negative.');
    }
    return new Money(result, this.currency);
  }

  public equals(other: Money): boolean {
    return this.amountInCents === other.getAmountInCents() && this.currency === other.getCurrency();
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.getCurrency()) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.getCurrency()}`);
    }
  }
}
