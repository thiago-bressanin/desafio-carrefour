import { IConsolidationRepository } from '../domain/IConsolidationRepository.js';
import { ICacheService } from '../domain/ICacheService.js';
import { DailyConsolidation } from '../domain/DailyConsolidation.js';

export interface TransactionCreatedEventPayload {
  eventId: string;
  transactionId: string;
  merchantId: string;
  type: 'CREDIT' | 'DEBIT';
  amountInCents: number;
  currency: string;
  createdAt: string;
}

export class ProcessTransactionEventUseCase {
  constructor(
    private readonly repository: IConsolidationRepository,
    private readonly cacheService: ICacheService
  ) {}

  public async execute(event: TransactionCreatedEventPayload): Promise<DailyConsolidation> {
    const txDate = event.createdAt.substring(0, 10); // YYYY-MM-DD format
    const merchantId = event.merchantId;

    let consolidation = await this.repository.findByMerchantAndDate(merchantId, txDate);
    if (!consolidation) {
      consolidation = DailyConsolidation.createEmpty(merchantId, txDate);
    }

    // Apply Domain Logic
    consolidation.applyTransaction(event.type, event.amountInCents);

    // Upsert into MongoDB
    await this.repository.upsert(consolidation);

    // Invalidate / Update Redis Cache
    const cacheKey = `consolidation:${merchantId}:${txDate}`;
    await this.cacheService.invalidate(cacheKey);

    console.log(`[ProcessTransactionEventUseCase] Processed event ${event.eventId} for merchant ${merchantId} on ${txDate}. Net balance: ${consolidation.getNetBalance()}`);

    return consolidation;
  }
}
