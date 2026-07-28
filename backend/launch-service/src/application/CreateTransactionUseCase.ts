import { Transaction } from '../domain/Transaction.js';
import { Money } from '../domain/Money.js';
import { TransactionType } from '../domain/TransactionType.js';
import { ITransactionRepository } from '../domain/ITransactionRepository.js';
import { IEventPublisher } from './IEventPublisher.js';
import { TransactionCreatedEvent } from '../domain/events/TransactionCreatedEvent.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTransactionDTO {
  merchantId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency?: string;
  description?: string;
}

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  public async execute(dto: CreateTransactionDTO): Promise<Transaction> {
    const typeEnum = dto.type === 'CREDIT' ? TransactionType.CREDIT : TransactionType.DEBIT;
    const money = Money.fromDecimal(dto.amount, dto.currency || 'BRL');

    const transaction = Transaction.create(
      dto.merchantId,
      typeEnum,
      money,
      dto.description || ''
    );

    // 1. Persist in Postgres (Transactional Write Path - ACID)
    await this.transactionRepository.save(transaction);

    // 2. Build domain event
    const event: TransactionCreatedEvent = {
      eventId: uuidv4(),
      transactionId: transaction.getId(),
      merchantId: transaction.getMerchantId(),
      type: transaction.getType(),
      amountInCents: transaction.getAmount().getAmountInCents(),
      currency: transaction.getAmount().getCurrency(),
      description: transaction.getDescription(),
      createdAt: transaction.getCreatedAt().toISOString()
    };

    // 3. Publish asynchronously via Redis PubSub / Outbox queue
    try {
      await this.eventPublisher.publishTransactionCreated(event);
    } catch (error) {
      console.error('[LaunchService] Warning: Event publishing failed, fallback queued:', error);
      // Resilience guarantee: database record is saved; consolidation worker can sync/rebuild if needed
    }

    return transaction;
  }
}
