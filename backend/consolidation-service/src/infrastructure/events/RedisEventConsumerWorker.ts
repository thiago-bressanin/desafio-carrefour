import { Redis } from 'ioredis';
import { ProcessTransactionEventUseCase } from '../../application/ProcessTransactionEventUseCase.js';

export class RedisEventConsumerWorker {
  private subscriber: Redis | null = null;
  private queueClient: Redis | null = null;
  private readonly channel: string = 'transaction.created';
  private readonly queueKey: string = 'transaction.events.queue';
  private isProcessingQueue: boolean = false;

  constructor(private readonly processUseCase: ProcessTransactionEventUseCase) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.subscriber = new Redis(redisUrl, { lazyConnect: true });
      this.queueClient = new Redis(redisUrl, { lazyConnect: true });

      this.subscriber.connect().then(() => this.subscribe()).catch((err) => {
        console.warn('[RedisWorker] Subscriber connection failed:', err.message);
      });

      this.queueClient.connect().then(() => this.startQueueLoop()).catch((err) => {
        console.warn('[RedisWorker] Queue connection failed:', err.message);
      });
    } catch (err) {
      console.warn('[RedisWorker] Redis initialization failed.');
    }
  }

  private async subscribe(): Promise<void> {
    if (!this.subscriber) return;
    await this.subscriber.subscribe(this.channel);
    console.log(`[RedisWorker] Subscribed to channel '${this.channel}'`);

    this.subscriber.on('message', async (channel, message) => {
      if (channel === this.channel) {
        try {
          const event = JSON.parse(message);
          await this.processUseCase.execute(event);
        } catch (err) {
          console.error('[RedisWorker] Failed to process PubSub message:', err);
        }
      }
    });
  }

  private async startQueueLoop(): Promise<void> {
    if (!this.queueClient || this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.queueClient) {
      try {
        const item = await this.queueClient.rpop(this.queueKey);
        if (item) {
          const event = JSON.parse(item);
          await this.processUseCase.execute(event);
        } else {
          // Wait 1 second if queue is empty
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
}
