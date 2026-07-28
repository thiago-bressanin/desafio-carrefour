import { Redis } from 'ioredis';
import { ICacheService } from '../../domain/ICacheService.js';

export class RedisCacheService implements ICacheService {
  private client: Redis | null = null;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1
      });
      this.client.connect().catch((err) => {
        console.warn('[RedisCache] Connection failed, cache disabled:', err.message);
        this.client = null;
      });
    } catch {
      this.client = null;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      return null;
    }
  }

  public async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.warn('[RedisCache] Error setting key:', err);
    }
  }

  public async invalidate(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      console.warn('[RedisCache] Error invalidating key:', err);
    }
  }
}
