import { Injectable, LoggerService } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Model } from 'mongoose';

import { CacheEntry, CacheEntryDocument } from './schemas/cache-entry.schema';

@Injectable()
export class CacheService {
  constructor(
    @InjectModel(CacheEntry.name) private readonly cacheModel: Model<CacheEntryDocument>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const entry = await this.cacheModel.findOne({ key }).lean().exec();
    if (!entry) return null;
    if (entry.expiresAt.getTime() <= Date.now()) {
      await this.cacheModel.deleteOne({ key }).exec();
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await this.cacheModel
      .updateOne({ key }, { $set: { value, expiresAt } }, { upsert: true })
      .exec();
    this.logger.debug?.({ msg: 'cache_set', key, ttlSeconds }, CacheService.name);
  }

  async invalidate(keyPrefix: string): Promise<number> {
    const res = await this.cacheModel.deleteMany({ key: new RegExp(`^${keyPrefix}`) }).exec();
    return res.deletedCount ?? 0;
  }
}
