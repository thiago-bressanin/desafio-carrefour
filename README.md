# Desafio Carrefour - Arquitetura de Soluções & Implementação de Referência

![Carrefour Architecture](https://img.shields.io/badge/Architecture-CQRS%20%7C%20DDD%20%7C%20EDA-blue?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20TypeScript%20%7C%20Angular%2018%20%7C%20Postgres%20%7C%20Mongo%20%7C%20Redis-green?style=for-the-badge)

Este repositório contém a solução completa de arquitetura de software para o **Controle de Fluxo de Caixa de Comerciantes ("Serviço de Lançamentos")** e **Relatório Consolidado Diário ("Serviço do Consolidado Diário")**.

---

## 🎯 Objetivo & Requisitos do Desafio

Construir uma arquitetura altamente escalável, resiliente e desacoplada baseada nos padrões **CQRS (Command Query Responsibility Segregation)**, **Event-Driven Architecture (EDA)** e **Domain-Driven Design (DDD)**.

### Requisito Crítico de Resiliência
> **"O serviço de lançamentos não pode ser afetado se o serviço de consolidação diária estiver indisponível."**

Nossa arquitetura garante **100% de disponibilidade no Serviço de Lançamentos (Escrita)**. Caso o Serviço do Consolidado Diário ou o banco MongoDB estejam indisponíveis, as transações são salvas de forma síncrona no PostgreSQL (garantia ACID) e publicadas de forma assíncrona no barramento de eventos (Redis Streams/Queue). Assim que o consumidor se recupera, o consolidado é sincronizado automaticamente sem perda de dados.

---

## 📐 Diagramas de Arquitetura (UML & C4 Model)

Todas as visões arquiteturais estão documentadas no diretório [`docs/diagrams/`](file:///c:/projects/desafio-carrefour/docs/diagrams):

1. **[C4 Context Diagram](file:///c:/projects/desafio-carrefour/docs/diagrams/c4_context.md)**: Visão macro do sistema e interações com atores (Comerciante, Gestor Financeiro, ERP Legado).
2. **[C4 Container Diagram](file:///c:/projects/desafio-carrefour/docs/diagrams/c4_container.md)**: Estrutura dos microserviços, barramento de eventos e bancos de dados.
3. **[C4 Component Diagram](file:///c:/projects/desafio-carrefour/docs/diagrams/c4_component.md)**: Detalhamento em camadas DDD (Domain, Application, Infrastructure, Presentation).
4. **[Event Flow & Sequence Diagram](file:///c:/projects/desafio-carrefour/docs/diagrams/event_flow_sequence.md)**: Fluxo assíncrono de ponta a ponta com Cache-Aside e injeção de latência.
5. **[Domain Model UML Class Diagram](file:///c:/projects/desafio-carrefour/docs/diagrams/domain_uml_class.md)**: Entidades, Aggregates, Value Objects, Domain Events e Repositórios.

---

## 🏗️ Decisões Arquiteturais & Tecnológicas (Trade-offs)

| Componente | Tecnologia | Papel & Justificativa Arquitetural |
| :--- | :--- | :--- |
| **Serviço de Lançamentos** | Node.js + Express (TypeScript / DDD) | **CQRS Write Side**: Registra débitos e créditos com validação de regras de domínio. |
| **Banco de Dados Transacional** | PostgreSQL 16 | **Garantia ACID & Precisão**: Armazena transações imutáveis com precisão inteira em centavos (`amountInCents`) para evitar erros de ponto flutuante. |
| **Serviço Consolidado Diário** | Node.js + Express (TypeScript / DDD) | **CQRS Read Side**: Agrega o total diário de créditos, débitos e saldo líquido por comerciante. |
| **Banco de Dados de Leitura** | MongoDB 7.0 | **Snapshots de Consulta O(1)**: Guarda documentos de consolidado pré-calculados otimizados para leitura pesada. |
| **Barramento & Cache** | Redis 7 | **Alta Performance (< 5ms)**: Atua como barramento Pub/Sub de eventos e camada de cache in-memory para saldos diários. |
| **Frontend Web** | Angular 18 (Standalone Components) | **Interface Financeira Moderna**: Dashboard interativo com gráficos, tabela de extrato, modal de lançamento e simulador de resiliência. |

---

## 🚀 Como Executar o Projeto Localmente

### Opção 1: Via Docker Compose (Recomendado)

Requisitos: Docker & Docker Compose instalados.

```bash
# 1. Clonar o repositório
git clone https://github.com/thiago-bressanin/desafio-carrefour.git
cd desafio-carrefour

# 2. Subir todos os microserviços e bancos de dados
docker-compose up --build
```

Acesse a plataforma no seu navegador:
- 🌐 **Frontend Dashboard (Angular)**: [http://localhost:80](http://localhost:80)
- ⚡ **Launch Service API (PostgreSQL)**: [http://localhost:3001/health](http://localhost:3001/health)
- 📊 **Consolidation Service API (MongoDB/Redis)**: [http://localhost:3002/health](http://localhost:3002/health)

---

### Opção 2: Execução sem Docker (Modo In-Memory / Dev)

Para rodar e testar os microserviços localmente via npm:

```bash
# 1. Instalar todas as dependências do repositório
npm run setup

# 2. Executar suíte de testes unitários do domínio DDD
npm test

# 3. Iniciar os microserviços (em terminais separados)
npm run start:launch
npm run start:consolidation
npm run start:frontend
```

---

## 📡 Guia de Endpoints da API REST

### 1. Serviço de Lançamentos (Port 3001)

#### `POST /api/v1/transactions`
Registra um novo lançamento financeiro (Débito ou Crédito).
```json
{
  "merchantId": "merchant_carrefour_01",
  "type": "CREDIT",
  "amount": 250.50,
  "description": "Venda Balcão PDV #12"
}
```
**Resposta (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "e6a0d4c8-47bf-4c7b-99ef-12a8459bdf11",
    "merchantId": "merchant_carrefour_01",
    "type": "CREDIT",
    "amount": 250.5,
    "amountInCents": 25050,
    "currency": "BRL",
    "description": "Venda Balcão PDV #12",
    "createdAt": "2026-07-28T20:15:00.000Z"
  }
}
```

#### `GET /api/v1/transactions/:merchantId`
Lista os lançamentos gravados no PostgreSQL para o comerciante.

---

### 2. Serviço do Consolidado Diário (Port 3002)

#### `GET /api/v1/consolidation/daily?merchantId=merchant_carrefour_01&date=2026-07-28`
Retorna o saldo consolidado diário (Cache Hit no Redis em < 3ms).
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant_carrefour_01",
    "date": "2026-07-28",
    "totalCredits": 1250.00,
    "totalDebits": 300.00,
    "netBalance": 950.00,
    "totalCreditsInCents": 125000,
    "totalDebitsInCents": 30000,
    "netBalanceInCents": 95000,
    "transactionCount": 8,
    "updatedAt": "2026-07-28T20:15:05.000Z",
    "source": "CACHE_HIT"
  }
}
```

---

## 🧪 Testes de Domínio & Validação de Resiliência

Execute a suíte de testes unitários das regras de negócio (Money Value Object, Transaction Entity, DailyConsolidation Aggregate, UseCases):

```bash
npm run test:launch
npm run test:consolidation
```

### Demonstração de Resiliência no Simulador:
1. Abra a interface web em `http://localhost`.
2. Clique no botão **"Simular Queda do Consolidado"**.
3. Realize um novo lançamento de Crédito ou Débito.
4. **Resultado**: O lançamento retorna `201 Created` instantaneamente, provando que a gravação das transações permanece 100% ativa mesmo com o leitor fora do ar. Ao reativar o consolidado, os eventos acumulados na fila são processados e o saldo diário é atualizado com exatidão.

---

## 📄 Licença
Desenvolvido por **Thiago Bressanin** para o **Desafio Técnico de Arquiteto de Soluções do Carrefour**. Licença MIT.
