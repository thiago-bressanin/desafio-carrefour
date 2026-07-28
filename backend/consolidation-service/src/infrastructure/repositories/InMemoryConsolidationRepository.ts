import { IConsolidationRepository } from '../../domain/IConsolidationRepository.js';
import { DailyConsolidation } from '../../domain/DailyConsolidation.js';

export class InMemoryConsolidationRepository implements IConsolidationRepository {
  private store: Map<string, DailyConsolidation> = new Map();

  private getKey(merchantId: string, date: string): string {
    return `${merchantId}:${date}`;
  }

  public async findByMerchantAndDate(merchantId: string, date: string): Promise<DailyConsolidation | null> {
    return this.store.get(this.getKey(merchantId, date)) || null;
  }

  public async upsert(consolidation: DailyConsolidation): Promise<void> {
    const key = this.getKey(consolidation.getMerchantId(), consolidation.getDate());
    this.store.set(key, consolidation);
  }

  public async findByMerchant(merchantId: string, limit: number = 30): Promise<DailyConsolidation[]> {
    const list: DailyConsolidation[] = [];
    for (const c of this.store.values()) {
      if (c.getMerchantId() === merchantId) {
        list.push(c);
      }
    }
    return list.sort((a, b) => b.getDate().localeCompare(a.getDate())).slice(0, limit);
  }
}
