import { ProcessTransactionEventUseCase } from '../../src/application/ProcessTransactionEventUseCase';
import { InMemoryConsolidationRepository } from '../../src/infrastructure/repositories/InMemoryConsolidationRepository';
import { InMemoryCacheService } from '../../src/infrastructure/cache/InMemoryCacheService';

describe('ProcessTransactionEventUseCase', () => {
  it('should update daily aggregate and invalidate cache upon processing event', async () => {
    const repo = new InMemoryConsolidationRepository();
    const cache = new InMemoryCacheService();
    const useCase = new ProcessTransactionEventUseCase(repo, cache);

    // Warm cache
    await cache.set('consolidation:m-55:2026-07-28', { netBalance: 0 });

    const result = await useCase.execute({
      eventId: 'evt-1',
      transactionId: 'tx-1',
      merchantId: 'm-55',
      type: 'CREDIT',
      amountInCents: 25000,
      currency: 'BRL',
      createdAt: '2026-07-28T10:00:00.000Z'
    });

    expect(result.getTotalCredits()).toBe(250);
    expect(result.getNetBalance()).toBe(250);

    // Check cache invalidation
    const cached = await cache.get('consolidation:m-55:2026-07-28');
    expect(cached).toBeNull();
  });
});
