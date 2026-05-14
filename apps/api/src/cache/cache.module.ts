import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CacheService } from './cache.service';
import { CacheEntry, CacheEntrySchema } from './schemas/cache-entry.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: CacheEntry.name, schema: CacheEntrySchema }])],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
