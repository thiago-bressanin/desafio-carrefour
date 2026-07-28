import { Money } from '../../src/domain/Money';

describe('Money Value Object', () => {
  it('should correctly store cents and return decimal amount', () => {
    const m = new Money(15050, 'BRL');
    expect(m.getAmountInCents()).toBe(15050);
    expect(m.getAmount()).toBe(150.5);
    expect(m.getCurrency()).toBe('BRL');
  });

  it('should create Money from decimal', () => {
    const m = Money.fromDecimal(99.99);
    expect(m.getAmountInCents()).toBe(9999);
    expect(m.getAmount()).toBe(99.99);
  });

  it('should perform precision arithmetic without IEEE float errors', () => {
    const m1 = Money.fromDecimal(0.1);
    const m2 = Money.fromDecimal(0.2);
    const sum = m1.add(m2);
    expect(sum.getAmount()).toBe(0.3);
    expect(sum.getAmountInCents()).toBe(30);
  });

  it('should throw error on negative cents', () => {
    expect(() => new Money(-50)).toThrow();
  });
});
