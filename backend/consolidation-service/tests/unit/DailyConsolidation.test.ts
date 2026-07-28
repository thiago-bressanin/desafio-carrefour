import { DailyConsolidation } from '../../src/domain/DailyConsolidation';

describe('DailyConsolidation Aggregate', () => {
  it('should initialize empty consolidation correctly', () => {
    const c = DailyConsolidation.createEmpty('m-123', '2026-07-28');

    expect(c.getMerchantId()).toBe('m-123');
    expect(c.getDate()).toBe('2026-07-28');
    expect(c.getTotalCredits()).toBe(0);
    expect(c.getTotalDebits()).toBe(0);
    expect(c.getNetBalance()).toBe(0);
    expect(c.getTransactionCount()).toBe(0);
  });

  it('should process CREDIT and DEBIT transactions accurately', () => {
    const c = DailyConsolidation.createEmpty('m-123', '2026-07-28');

    c.applyTransaction('CREDIT', 15000); // R$ 150.00
    c.applyTransaction('CREDIT', 5000);  // R$ 50.00
    c.applyTransaction('DEBIT', 4000);   // R$ 40.00

    expect(c.getTotalCredits()).toBe(200);
    expect(c.getTotalDebits()).toBe(40);
    expect(c.getNetBalance()).toBe(160);
    expect(c.getTransactionCount()).toBe(3);
  });
});
