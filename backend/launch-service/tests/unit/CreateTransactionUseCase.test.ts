import { CreateTransactionUseCase } from '../../src/application/CreateTransactionUseCase';
import { InMemoryTransactionRepository } from '../../src/infrastructure/repositories/InMemoryTransactionRepository';
import { IEventPublisher } from '../../src/application/IEventPublisher';
import { TransactionType } from '../../src/domain/TransactionType';

class MockEventPublisher implements IEventPublisher {
  public events: any[] = [];
  async publishTransactionCreated(event: any): Promise<void> {
    this.events.push(event);
  }
}

describe('CreateTransactionUseCase', () => {
  it('should create and persist a transaction and publish an event', async () => {
    const repo = new InMemoryTransactionRepository();
    const publisher = new MockEventPublisher();
    const useCase = new CreateTransactionUseCase(repo, publisher);

    const result = await useCase.execute({
      merchantId: 'm-100',
      type: 'CREDIT',
      amount: 250.75,
      description: 'Pagamento PIX'
    });

    expect(result.getId()).toBeDefined();
    expect(result.getMerchantId()).toBe('m-100');
    expect(result.getType()).toBe(TransactionType.CREDIT);
    expect(result.getAmount().getAmountInCents()).toBe(25075);

    const saved = await repo.findById(result.getId());
    expect(saved).not.toBeNull();
    expect(publisher.events.length).toBe(1);
    expect(publisher.events[0].amountInCents).toBe(25075);
  });
});
