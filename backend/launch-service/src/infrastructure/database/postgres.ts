import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cashflow',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

export async function initPostgres(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(36) PRIMARY KEY,
        merchant_id VARCHAR(100) NOT NULL,
        type VARCHAR(10) NOT NULL,
        amount_in_cents INT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions (merchant_id, created_at DESC);
    `);
    console.log('[PostgreSQL] Database initialized and tables ready.');
  } catch (error) {
    console.error('[PostgreSQL] Initialization error:', error);
  } finally {
    client.release();
  }
}
