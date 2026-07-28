import { Transaction } from '../../src/domain/Transaction';
import { Money } from '../../src/domain/Money';
import { TransactionType } from '../../src/domain/TransactionType';

describe('Transaction Entity', () => {
  it('should create a valid CREDIT transaction', () => {
    const money = Money.fromDecimal(500);
    const tx = Transaction.create('merchant-1', TransactionType.CREDIT, money, 'Venda Balcão');

    expect(tx.getId()).toBeDefined();
    expect(tx.getMerchantId()).toBe('merchant-1');
    expect(tx.getType()).toBe(TransactionType.CREDIT);
    expect(tx.getAmount().getAmount()).toBe(500);
    expect(tx.getDescription()).toBe('Venda Balcão');
  });

  it('should throw error when merchantId is missing', () => {
    const money = Money.fromDecimal(100);
    expect(() => Transaction.create('', TransactionType.DEBIT, money, 'Test')).toThrow('Merchant ID is required.');
  });
});
