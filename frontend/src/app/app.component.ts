import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface TransactionItem {
  id: string;
  merchantId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  amountInCents: number;
  currency: string;
  description: string;
  createdAt: string;
}

interface ConsolidationData {
  merchantId: string;
  date: string;
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  totalCreditsInCents: number;
  totalDebitsInCents: number;
  netBalanceInCents: number;
  transactionCount: number;
  updatedAt: string;
  source: 'CACHE_HIT' | 'DATABASE';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-container">
      <!-- HEADER -->
      <header class="header-bar glass-card">
        <div class="brand">
          <div class="logo-icon">🛒</div>
          <div>
            <h1>Carrefour Cash Flow</h1>
            <span class="sub-title">Plataforma de Lançamentos & Consolidado Diário</span>
          </div>
        </div>

        <div class="controls-group">
          <div class="control-item">
            <label>Merchant ID:</label>
            <input type="text" [(ngModel)]="merchantId" (change)="loadAllData()" class="font-mono"/>
          </div>

          <div class="control-item">
            <label>Data:</label>
            <input type="date" [(ngModel)]="selectedDate" (change)="loadAllData()"/>
          </div>

          <button class="btn-primary" (click)="openModal()">
            ⚡ Novo Lançamento
          </button>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <main class="main-content">
        <!-- RESILIENCE SIMULATOR BANNER -->
        <section class="glass-card resilience-banner" [class.simulating]="isSimulatingOutage()">
          <div class="banner-info">
            <span class="pulse-dot" [class.offline]="isSimulatingOutage()"></span>
            <div>
              <h3>Simulador de Resiliência CQRS & Alta Disponibilidade</h3>
              <p>
                {{ isSimulatingOutage()
                  ? '⚠️ MODO SIMULAÇÃO: Serviço do Consolidado Diário OFFLINE. Novos lançamentos continuam 100% disponíveis com resposta 201 Created!'
                  : '🟢 Todos os microserviços operacionais (Serviço de Lançamentos em PostgreSQL + Consolidado Diário em Redis/MongoDB).'
                }}
              </p>
            </div>
          </div>
          <button class="btn-secondary" (click)="toggleSimulatedOutage()">
            {{ isSimulatingOutage() ? 'Reativar Serviço Consolidado' : 'Simular Queda do Consolidado' }}
          </button>
        </section>

        <!-- KPI METRICS GRID -->
        <section class="metrics-grid">
          <!-- TOTAL CREDITS -->
          <div class="glass-card metric-card credit">
            <div class="metric-header">
              <span>Total Créditos (Entradas)</span>
              <span class="metric-icon">📈</span>
            </div>
            <div class="metric-value credit-text">
              R$ {{ consolidationData()?.totalCredits | number:'1.2-2' }}
            </div>
            <div class="metric-footer font-mono">
              {{ consolidationData()?.totalCreditsInCents || 0 }} centavos
            </div>
          </div>

          <!-- TOTAL DEBITS -->
          <div class="glass-card metric-card debit">
            <div class="metric-header">
              <span>Total Débitos (Saídas)</span>
              <span class="metric-icon">📉</span>
            </div>
            <div class="metric-value debit-text">
              R$ {{ consolidationData()?.totalDebits | number:'1.2-2' }}
            </div>
            <div class="metric-footer font-mono">
              {{ consolidationData()?.totalDebitsInCents || 0 }} centavos
            </div>
          </div>

          <!-- NET CONSOLIDATED BALANCE -->
          <div class="glass-card metric-card balance">
            <div class="metric-header">
              <span>Saldo Liquido Consolidado</span>
              <span class="metric-icon">⚖️</span>
            </div>
            <div class="metric-value" [class.credit-text]="(consolidationData()?.netBalance || 0) >= 0" [class.debit-text]="(consolidationData()?.netBalance || 0) < 0">
              R$ {{ consolidationData()?.netBalance | number:'1.2-2' }}
            </div>
            <div class="metric-footer">
              Total de {{ consolidationData()?.transactionCount || 0 }} lançamentos no dia
            </div>
          </div>

          <!-- CACHE & LATENCY STATUS -->
          <div class="glass-card metric-card cache">
            <div class="metric-header">
              <span>Status da Consulta (CQRS)</span>
              <span class="metric-icon">⚡</span>
            </div>
            <div class="cache-status-container">
              <span class="badge" [class.badge-cache-hit]="consolidationData()?.source === 'CACHE_HIT'" [class.badge-cache-miss]="consolidationData()?.source !== 'CACHE_HIT'">
                {{ consolidationData()?.source === 'CACHE_HIT' ? 'REDIS CACHE HIT (< 3ms)' : 'MONGODB DATABASE' }}
              </span>
              <span class="latency-tag font-mono">Latência: {{ responseTimeMs() }}ms</span>
            </div>
            <div class="metric-footer">
              Última sincronização: {{ consolidationData()?.updatedAt | date:'HH:mm:ss' }}
            </div>
          </div>
        </section>

        <!-- DASHBOARD BODY: CHART & RECENT TRANSACTIONS -->
        <section class="dashboard-body">
          <!-- VISUAL CONSOLIDATION BAR CHART -->
          <div class="glass-card chart-card">
            <div class="card-title">
              <h2>Balanço Consolidado do Dia</h2>
              <span class="text-muted font-mono">{{ selectedDate }}</span>
            </div>
            <div class="chart-wrapper">
              <div class="bar-group">
                <div class="bar-label">Créditos</div>
                <div class="bar-track">
                  <div class="bar-fill credit-bar" [style.width.%]="getBarWidth(consolidationData()?.totalCredits)"></div>
                </div>
                <div class="bar-value font-mono">R$ {{ consolidationData()?.totalCredits | number:'1.2-2' }}</div>
              </div>

              <div class="bar-group">
                <div class="bar-label">Débitos</div>
                <div class="bar-track">
                  <div class="bar-fill debit-bar" [style.width.%]="getBarWidth(consolidationData()?.totalDebits)"></div>
                </div>
                <div class="bar-value font-mono">R$ {{ consolidationData()?.totalDebits | number:'1.2-2' }}</div>
              </div>

              <div class="bar-group">
                <div class="bar-label">Saldo Líquido</div>
                <div class="bar-track">
                  <div class="bar-fill balance-bar" [style.width.%]="getBarWidth(consolidationData()?.netBalance)"></div>
                </div>
                <div class="bar-value font-mono">R$ {{ consolidationData()?.netBalance | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>

          <!-- TRANSACTIONS TABLE -->
          <div class="glass-card table-card">
            <div class="card-title">
              <h2>Últimos Lançamentos (PostgreSQL Store)</h2>
              <button class="btn-secondary sm" (click)="loadTransactions()">🔄 Atualizar</button>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data / Hora</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of transactions()">
                    <td class="font-mono">{{ tx.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    <td>
                      <span class="badge" [class.badge-credit]="tx.type === 'CREDIT'" [class.badge-debit]="tx.type === 'DEBIT'">
                        {{ tx.type === 'CREDIT' ? 'CRÉDITO' : 'DÉBITO' }}
                      </span>
                    </td>
                    <td>{{ tx.description || 'Lançamento sem descrição' }}</td>
                    <td class="font-mono" [class.credit-text]="tx.type === 'CREDIT'" [class.debit-text]="tx.type === 'DEBIT'">
                      {{ tx.type === 'CREDIT' ? '+' : '-' }} R$ {{ tx.amount | number:'1.2-2' }}
                    </td>
                  </tr>
                  <tr *ngIf="transactions().length === 0">
                    <td colspan="4" class="empty-state">
                      Nenhum lançamento registrado para este merchant.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <!-- NEW TRANSACTION MODAL -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="glass-card modal-box">
          <div class="modal-header">
            <h3>Registrar Novo Lançamento Financeiro</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form (ngSubmit)="submitTransaction()" class="modal-form">
            <div class="form-group">
              <label>Tipo de Operação:</label>
              <div class="type-selector">
                <button type="button" class="type-btn credit" [class.active]="newTxType === 'CREDIT'" (click)="newTxType = 'CREDIT'">
                  ➕ CRÉDITO (Entrada)
                </button>
                <button type="button" class="type-btn debit" [class.active]="newTxType === 'DEBIT'" (click)="newTxType = 'DEBIT'">
                  ➖ DÉBITO (Saída)
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Valor (R$):</label>
              <input type="number" step="0.01" min="0.01" [(ngModel)]="newTxAmount" name="amount" required placeholder="0.00" class="font-mono text-lg"/>
            </div>

            <div class="form-group">
              <label>Descrição / Observação:</label>
              <input type="text" [(ngModel)]="newTxDescription" name="description" placeholder="Ex: Venda de mercadoria balcão #402"/>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="isSubmitting">
                {{ isSubmitting ? 'Salvando...' : 'Confirmar Lançamento' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 24px;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-icon {
      font-size: 2.2rem;
      background: rgba(59, 130, 246, 0.2);
      padding: 8px 12px;
      border-radius: 12px;
    }
    .brand h1 {
      font-size: 1.4rem;
      font-weight: 800;
      color: #fff;
    }
    .sub-title {
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .controls-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .control-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .control-item label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
    }

    .resilience-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      margin-bottom: 24px;
      border-left: 4px solid #10b981;
    }
    .resilience-banner.simulating {
      border-left-color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }
    .banner-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .pulse-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    .pulse-dot.offline {
      background: #f59e0b;
      box-shadow: 0 0 10px #f59e0b;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .metric-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .metric-header {
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .metric-value {
      font-size: 1.8rem;
      font-weight: 800;
      margin: 12px 0 4px 0;
    }
    .credit-text { color: #10b981; }
    .debit-text { color: #ef4444; }
    .metric-footer {
      font-size: 0.75rem;
      color: #64748b;
    }
    .cache-status-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 10px 0;
    }
    .latency-tag {
      font-size: 0.8rem;
      color: #60a5fa;
    }

    .dashboard-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .dashboard-body { grid-template-columns: 1fr; }
    }
    .card-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .card-title h2 {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .chart-card, .table-card {
      padding: 24px;
    }
    .chart-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-top: 10px;
    }
    .bar-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .bar-label {
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .bar-track {
      height: 24px;
      background: rgba(15, 23, 42, 0.8);
      border-radius: 6px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .credit-bar { background: linear-gradient(90deg, #10b981, #34d399); }
    .debit-bar { background: linear-gradient(90deg, #ef4444, #f87171); }
    .balance-bar { background: linear-gradient(90deg, #3b82f6, #60a5fa); }

    .table-container {
      overflow-x: auto;
      max-height: 380px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th, td {
      padding: 12px 14px;
      font-size: 0.85rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    th {
      color: #94a3b8;
      font-weight: 600;
      background: rgba(15, 23, 42, 0.5);
    }
    .empty-state {
      text-align: center;
      padding: 30px;
      color: #64748b;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
    }
    .modal-box {
      width: 100%;
      max-width: 480px;
      padding: 28px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .close-btn {
      background: transparent;
      color: #94a3b8;
      font-size: 1.2rem;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .type-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .type-btn {
      padding: 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(15, 23, 42, 0.6);
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .type-btn.credit.active {
      background: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      color: #10b981;
    }
    .type-btn.debit.active {
      background: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
      color: #ef4444;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 10px;
    }
  `]
})
export class AppComponent implements OnInit {
  merchantId = 'merchant_carrefour_01';
  selectedDate = new Date().toISOString().substring(0, 10);

  transactions = signal<TransactionItem[]>([]);
  consolidationData = signal<ConsolidationData | null>(null);
  responseTimeMs = signal<number>(0);
  isSimulatingOutage = signal<boolean>(false);

  showModal = signal<boolean>(false);
  newTxType: 'CREDIT' | 'DEBIT' = 'CREDIT';
  newTxAmount: number | null = null;
  newTxDescription = '';
  isSubmitting = false;

  private launchApiUrl = 'http://localhost:3001/api/v1';
  private consolidationApiUrl = 'http://localhost:3002/api/v1';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadTransactions();
    this.loadConsolidation();
  }

  loadTransactions(): void {
    this.http.get<any>(`${this.launchApiUrl}/transactions/${this.merchantId}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.transactions.set(res.data);
        }
      },
      error: (err) => console.warn('Launch API offline or fallback:', err)
    });
  }

  loadConsolidation(): void {
    if (this.isSimulatingOutage()) {
      return; // Skip loading consolidation to simulate consolidation service outage
    }

    const start = performance.now();
    this.http
      .get<any>(`${this.consolidationApiUrl}/consolidation/daily?merchantId=${this.merchantId}&date=${this.selectedDate}`)
      .subscribe({
        next: (res) => {
          const latency = Math.round(performance.now() - start);
          this.responseTimeMs.set(latency);
          if (res.success) {
            this.consolidationData.set(res.data);
          }
        },
        error: (err) => console.warn('Consolidation API offline:', err)
      });
  }

  openModal(): void {
    this.newTxAmount = null;
    this.newTxDescription = '';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submitTransaction(): void {
    if (!this.newTxAmount || this.newTxAmount <= 0) return;
    this.isSubmitting = true;

    const payload = {
      merchantId: this.merchantId,
      type: this.newTxType,
      amount: this.newTxAmount,
      description: this.newTxDescription
    };

    this.http.post<any>(`${this.launchApiUrl}/transactions`, payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closeModal();
        this.loadTransactions();

        // Refresh consolidation after slight delay to allow async worker processing
        setTimeout(() => this.loadConsolidation(), 500);
      },
      error: (err) => {
        this.isSubmitting = false;
        alert('Erro ao salvar lançamento: ' + (err.error?.error || err.message));
      }
    });
  }

  toggleSimulatedOutage(): void {
    this.isSimulatingOutage.set(!this.isSimulatingOutage());
    if (!this.isSimulatingOutage()) {
      this.loadConsolidation();
    }
  }

  getBarWidth(value: number | undefined): number {
    if (!value || value <= 0) return 0;
    const max = Math.max(
      this.consolidationData()?.totalCredits || 1,
      this.consolidationData()?.totalDebits || 1,
      this.consolidationData()?.netBalance || 1
    );
    return Math.min(100, Math.round((value / max) * 100));
  }
}
