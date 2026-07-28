import { IConsolidationRepository } from '../domain/IConsolidationRepository.js';
import { ICacheService } from '../domain/ICacheService.js';
import { DailyConsolidation } from '../domain/DailyConsolidation.js';

export interface RawTransactionInput {
  type: 'CREDIT' | 'DEBIT';
  amountInCents: number;
}

export class RebuildConsolidationUseCase {
  constructor(
    private readonly repository: IConsolidationRepository,
    private readonly cacheService: ICacheService
  ) {}

  public async execute(
    merchantId: string,
    date: string,
    transactions: RawTransactionInput[]
  ): Promise<DailyConsolidation> {
    const consolidation = DailyConsolidation.createEmpty(merchantId, date);

    for (const tx of transactions) {
      consolidation.applyTransaction(tx.type, tx.amountInCents);
    }

    await this.repository.upsert(consolidation);

    const cacheKey = `consolidation:${merchantId}:${date}`;
    await this.cacheService.invalidate(cacheKey);

    return consolidation;
  }
}
