export interface TransactionCreatedEvent {
  eventId: string;
  transactionId: string;
  merchantId: string;
  type: 'CREDIT' | 'DEBIT';
  amountInCents: number;
  currency: string;
  description: string;
  createdAt: string;
}
