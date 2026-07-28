# Domain Model UML Class Diagram

This diagram displays the Domain-Driven Design (DDD) domain entities, aggregates, value objects, domain events, repositories, and interfaces for both microservices.

```mermaid
classDiagram
    namespace LaunchServiceDomain {
        class TransactionType {
            <<enumeration>>
            CREDIT
            DEBIT
        }

        class Money {
            -amountInCents: number
            -currency: string
            +constructor(amountInCents: number, currency: string)
            +getAmount(): number
            +getAmountInCents(): number
            +add(other: Money): Money
            +subtract(other: Money): Money
            +equals(other: Money): boolean
        }

        class Transaction {
            -id: string
            -merchantId: string
            -type: TransactionType
            -amount: Money
            -description: string
            -createdAt: Date
            +constructor(id, merchantId, type, amount, description, createdAt)
            +create(merchantId, type, amount, description): Transaction
            +getId(): string
            +getMerchantId(): string
            +getType(): TransactionType
            +getAmount(): Money
            +getDescription(): string
            +getCreatedAt(): Date
        }

        class TransactionCreatedEvent {
            +eventId: string
            +transactionId: string
            +merchantId: string
            +type: string
            +amountInCents: number
            +currency: string
            +occurredOn: Date
        }

        class ITransactionRepository {
            <<interface>>
            +save(transaction: Transaction): Promise~void~
            +findById(id: string): Promise~Transaction | null~
            +findByMerchantId(merchantId: string, limit: number): Promise~Transaction[]~
        }
    }

    namespace ConsolidationServiceDomain {
        class DailyConsolidation {
            -id: string
            -merchantId: string
            -date: string
            -totalCreditsInCents: number
            -totalDebitsInCents: number
            -netBalanceInCents: number
            -transactionCount: number
            -updatedAt: Date
            +constructor(id, merchantId, date, totalCredits, totalDebits, netBalance, count, updatedAt)
            +createEmpty(merchantId: string, date: string): DailyConsolidation
            +applyTransaction(type: TransactionType, amountInCents: number): void
            +getTotalCredits(): number
            +getTotalDebits(): number
            +getNetBalance(): number
        }

        class IConsolidationRepository {
            <<interface>>
            +findByMerchantAndDate(merchantId: string, date: string): Promise~DailyConsolidation | null~
            +upsert(consolidation: DailyConsolidation): Promise~void~
            +rebuildConsolidation(merchantId: string, date: string, transactions: Array): Promise~DailyConsolidation~
        }

        class ICacheService {
            <<interface>>
            +get~T~(key: string): Promise~T | null~
            +set(key: string, value: any, ttlSeconds: number): Promise~void~
            +invalidate(key: string): Promise~void~
        }
    }

    Transaction --> Money : uses
    Transaction --> TransactionType : uses
    Transaction ..> TransactionCreatedEvent : raises
    ITransactionRepository ..> Transaction : operates on
    DailyConsolidation --> TransactionType : processes
    IConsolidationRepository ..> DailyConsolidation : operates on
```
