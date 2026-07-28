import { Redis } from 'ioredis';
import { IEventPublisher } from '../../application/IEventPublisher.js';
import { TransactionCreatedEvent } from '../../domain/events/TransactionCreatedEvent.js';

export class RedisEventPublisher implements IEventPublisher {
  private redis: Redis | null = null;
  private readonly channel: string = 'transaction.created';
  private readonly queueKey: string = 'transaction.events.queue';

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 2
      });
      this.redis.connect().catch((err) => {
        console.warn('[RedisPublisher] Redis connection failed, operates in memory mock:', err.message);
        this.redis = null;
      });
    } catch {
      this.redis = null;
    }
  }

  public async publishTransactionCreated(event: TransactionCreatedEvent): Promise<void> {
    const payload = JSON.stringify(event);
    if (this.redis) {
      try {
        // 1. PubSub broadcast
        await this.redis.publish(this.channel, payload);
        // 2. Reliable Queue Push (LPUSH for persistent worker pickup)
        await this.redis.lpush(this.queueKey, payload);
        console.log(`[RedisPublisher] Published event ${event.eventId} for merchant ${event.merchantId}`);
      } catch (err) {
        console.error('[RedisPublisher] Error publishing to Redis:', err);
      }
    } else {
      console.log(`[MockPublisher] Event emitted (Redis offline): ${payload}`);
    }
  }
}
