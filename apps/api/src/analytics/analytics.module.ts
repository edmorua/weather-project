import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SearchEvent, SearchEventSchema } from './schemas/search-event.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SearchEvent.name, schema: SearchEventSchema }])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
