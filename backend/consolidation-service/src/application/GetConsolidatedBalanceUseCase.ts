import { IConsolidationRepository } from '../domain/IConsolidationRepository.js';
import { ICacheService } from '../domain/ICacheService.js';
import { DailyConsolidation } from '../domain/DailyConsolidation.js';

export interface ConsolidatedBalanceResult {
  merchantId: string;
  date: string;
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  totalCreditsInCents: number;
  totalDebitsInCents: number;
  netBalanceInCents: number;
  transactionCount: number;
  updatedAt: string;
  source: 'CACHE_HIT' | 'DATABASE';
}

export class GetConsolidatedBalanceUseCase {
  constructor(
    private readonly repository: IConsolidationRepository,
    private readonly cacheService: ICacheService
  ) {}

  public async execute(merchantId: string, date: string): Promise<ConsolidatedBalanceResult> {
    if (!merchantId) throw new Error('Merchant ID is required.');
    if (!date) throw new Error('Date is required.');

    const cacheKey = `consolidation:${merchantId}:${date}`;

    // 1. Try Cache-Aside from Redis
    try {
      const cached = await this.cacheService.get<ConsolidatedBalanceResult>(cacheKey);
      if (cached) {
        return { ...cached, source: 'CACHE_HIT' };
      }
    } catch (error) {
      console.warn('[ConsolidationUseCase] Cache retrieval failed, falling back to DB:', error);
    }

    // 2. Fetch from MongoDB
    let record = await this.repository.findByMerchantAndDate(merchantId, date);
    if (!record) {
      record = DailyConsolidation.createEmpty(merchantId, date);
    }

    const result: ConsolidatedBalanceResult = {
      merchantId: record.getMerchantId(),
      date: record.getDate(),
      totalCredits: record.getTotalCredits(),
      totalDebits: record.getTotalDebits(),
      netBalance: record.getNetBalance(),
      totalCreditsInCents: record.getTotalCreditsInCents(),
      totalDebitsInCents: record.getTotalDebitsInCents(),
      netBalanceInCents: record.getNetBalanceInCents(),
      transactionCount: record.getTransactionCount(),
      updatedAt: record.getUpdatedAt().toISOString(),
      source: 'DATABASE'
    };

    // 3. Populate Redis Cache (TTL 300s)
    try {
      await this.cacheService.set(cacheKey, result, 300);
    } catch (error) {
      console.warn('[ConsolidationUseCase] Cache write failed:', error);
    }

    return result;
  }
}
