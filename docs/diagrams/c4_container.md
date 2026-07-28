# C4 Model - Container Diagram (Level 2)

This diagram shows the high-level technical containers: Frontend SPA, Microservices (Launch Service & Consolidation Service), Databases (PostgreSQL & MongoDB), and Event Bus / Cache (Redis).

```mermaid
C4Container
    title Container Diagram - Merchant Cash Flow & Daily Consolidation Architecture

    Person(user, "Comerciante / Gestor", "Usuário do sistema de fluxo de caixa")

    Container_Boundary(c1, "Plataforma de Fluxo de Caixa Diário") {
        Container(frontend, "Single-Page Application", "Angular 18 / SPA", "Interface gráfica moderna (Glassmorphism) para lançamentos e dashboards de saldo consolidado.")
        Container(launch_service, "Serviço de Lançamentos", "Node.js / Express / DDD", "Microserviço de Escrita (CQRS Command). Processa e persiste débitos e créditos com garantias ACID.")
        Container(consolidation_service, "Serviço do Consolidado Diário", "Node.js / Express / DDD", "Microserviço de Leitura (CQRS Query). Processa eventos de lançamentos e consolida saldos diários em tempo real.")

        ContainerDb(postgres_db, "PostgreSQL Database", "Relational DB", "Armazena lançamentos transacionais de forma imutável (Audit Trail & ACID).")
        ContainerDb(mongo_db, "MongoDB Document Store", "NoSQL DB", "Armazena consolidados diários pré-calculados para consultas otimizadas O(1).")
        ContainerDb(redis, "Redis Cluster", "In-Memory Data Store", "Cache de saldos consolidados diários e Pub/Sub Broker de Mensagens para comunicação desacoplada.")
    }

    Rel(user, frontend, "Acessa via navegador", "HTTPS")
    Rel(frontend, launch_service, "POST /api/v1/transactions", "JSON / REST")
    Rel(frontend, consolidation_service, "GET /api/v1/consolidation/daily", "JSON / REST")

    Rel(launch_service, postgres_db, "Grava/Lê lançamentos", "SQL / TCP")
    Rel(launch_service, redis, "Publica evento 'TransactionCreated'", "Redis PubSub / Reliable Queue")

    Rel(redis, consolidation_service, "Consome eventos de lançamentos", "Redis Event Consumer")
    Rel(consolidation_service, mongo_db, "Persiste/Atualiza consolidados diários", "MongoDB Wire Protocol")
    Rel(consolidation_service, redis, "Lê/Invalida cache de saldo consolidado", "RESP / TCP")
```
