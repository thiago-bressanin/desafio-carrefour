import { GetConsolidatedBalanceUseCase } from '../../src/application/GetConsolidatedBalanceUseCase';
import { InMemoryConsolidationRepository } from '../../src/infrastructure/repositories/InMemoryConsolidationRepository';
import { InMemoryCacheService } from '../../src/infrastructure/cache/InMemoryCacheService';
import { DailyConsolidation } from '../../src/domain/DailyConsolidation';

describe('GetConsolidatedBalanceUseCase', () => {
  it('should fetch from database when cache is missing and then serve from cache', async () => {
    const repo = new InMemoryConsolidationRepository();
    const cache = new InMemoryCacheService();
    const useCase = new GetConsolidatedBalanceUseCase(repo, cache);

    // Populate repo
    const consolidation = DailyConsolidation.createEmpty('m-1', '2026-07-28');
    consolidation.applyTransaction('CREDIT', 10000);
    await repo.upsert(consolidation);

    // First call -> DATABASE
    const firstCall = await useCase.execute('m-1', '2026-07-28');
    expect(firstCall.source).toBe('DATABASE');
    expect(firstCall.netBalance).toBe(100);

    // Second call -> CACHE_HIT
    const secondCall = await useCase.execute('m-1', '2026-07-28');
    expect(secondCall.source).toBe('CACHE_HIT');
    expect(secondCall.netBalance).toBe(100);
  });
});
