import { DailyConsolidation } from './DailyConsolidation.js';

export interface IConsolidationRepository {
  findByMerchantAndDate(merchantId: string, date: string): Promise<DailyConsolidation | null>;
  upsert(consolidation: DailyConsolidation): Promise<void>;
  findByMerchant(merchantId: string, limit?: number): Promise<DailyConsolidation[]>;
}
