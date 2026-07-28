import { ICacheService } from '../../domain/ICacheService.js';

export class InMemoryCacheService implements ICacheService {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  public async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  public async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  public async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
