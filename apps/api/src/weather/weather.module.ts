import { Module } from '@nestjs/common';

import { AnalyticsModule } from '../analytics/analytics.module';
import { CacheModule } from '../cache/cache.module';
import { OpenWeatherProvider } from './providers/openweather.provider';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

@Module({
  imports: [CacheModule, AnalyticsModule],
  controllers: [WeatherController],
  providers: [WeatherService, OpenWeatherProvider],
})
export class WeatherModule {}
