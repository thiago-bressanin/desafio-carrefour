# Event Flow & Sequence Diagram

This diagram shows the complete asynchronous end-to-end execution flow of a transaction, showing how CQRS and Event-Driven Architecture decouple the write path from the consolidation query path.

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Comerciante (SPA Frontend)
    participant LaunchAPI as Launch Service API
    participant LaunchDB as PostgreSQL (Relational DB)
    participant RedisBus as Redis (Event Bus / Stream)
    participant Worker as Consolidation Worker
    participant ConsolDB as MongoDB (Read Store)
    participant RedisCache as Redis (Cache)

    Note over Merchant, LaunchAPI: 1. Ação de Escrita (Novo Lançamento)
    Merchant->>LaunchAPI: POST /api/v1/transactions { type: 'CREDIT', amount: 150.00, merchantId: 'm123' }
    LaunchAPI->>LaunchAPI: Valida Entidade Domain (Money & Transaction Rules)
    LaunchAPI->>LaunchDB: INSERT INTO transactions (id, merchant_id, type, amount, date)
    LaunchDB-->>LaunchAPI: OK (Persistido com garantia ACID)
    LaunchAPI->>RedisBus: PUBLISH "transaction.created" { id, merchantId, type, amount, createdAt }
    LaunchAPI-->>Merchant: 201 Created { id: "tx-789", status: "SUCCESS" }

    Note over Worker, ConsolDB: 2. Processamento Assíncrono do Evento (CQRS Read Side)
    RedisBus-->>Worker: Recebe Evento "transaction.created"
    Worker->>ConsolDB: Busca Consolidado do Dia (merchantId, date)
    alt Consolidado não existe para a data
        Worker->>Worker: Cria novo Agregado DailyConsolidation
    else Consolidado existe
        Worker->>Worker: Acumula valor (Credit +150.00, NetBalance +150.00)
    end
    Worker->>ConsolDB: UPSERT daily_consolidations (merchantId, date, totalCredits, totalDebits, netBalance)
    Worker->>RedisCache: Invalida / Atualiza Cache "consolidation:m123:2026-07-28"

    Note over Merchant, RedisCache: 3. Consulta de Saldo Consolidado (Query Side)
    Merchant->>Worker: GET /api/v1/consolidation/daily?merchantId=m123&date=2026-07-28
    alt Cache HIT (Sub-5ms)
        Worker->>RedisCache: GET "consolidation:m123:2026-07-28"
        RedisCache-->>Worker: Retorna JSON Consolidado
        Worker-->>Merchant: 200 OK (Source: Cache HIT, Latency < 3ms)
    else Cache MISS
        Worker->>ConsolDB: FindOne ({ merchantId: 'm123', date: '2026-07-28' })
        ConsolDB-->>Worker: Retorna Documento
        Worker->>RedisCache: SETEX "consolidation:m123:2026-07-28" (TTL 300s)
        Worker-->>Merchant: 200 OK (Source: Database)
    end
```
