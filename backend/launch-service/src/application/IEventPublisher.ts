import { TransactionCreatedEvent } from '../domain/events/TransactionCreatedEvent.js';

export interface IEventPublisher {
  publishTransactionCreated(event: TransactionCreatedEvent): Promise<void>;
}
