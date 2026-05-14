import { BadRequestException, Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppConfig } from '../config/configuration';
import { AnalyticsService } from '../analytics/analytics.service';
import { CacheService } from '../cache/cache.service';
import {
  deriveAdvisories,
  toCurrentConditions,
  toDailySummaries,
  toHourlyForecast,
} from './utils/weather.transform';
import { GeocodedLocation, TemperatureUnit, WeatherReport } from './utils/weather.types';
import { WeatherQueryDto } from './dto/weather-query.dto';
import { OpenWeatherProvider } from './providers/openweather.provider';

@Injectable()
export class WeatherService {
  private readonly cacheTtlSeconds: number;

  constructor(
    private readonly provider: OpenWeatherProvider,
    private readonly cacheService: CacheService,
    private readonly analyticsService: AnalyticsService,
    config: ConfigService<AppConfig, true>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.cacheTtlSeconds = config.get('cache.weatherTtlSeconds', { infer: true });
  }

  async geocode(query: string): Promise<GeocodedLocation[]> {
    if (!query?.trim()) {
      throw new BadRequestException('Query must not be empty');
    }
    return this.provider.geocode(query.trim());
  }

  async getReport(query: WeatherQueryDto): Promise<WeatherReport> {
    const units: TemperatureUnit = query.units ?? 'imperial';
    const location = await this.resolveLocation(query);
    const cacheKey = this.cacheKey(location, units);

    const cached = await this.cacheService.get<WeatherReport>(cacheKey);
    if (cached) {
      this.recordSearchAsync(location, units, true);
      return { ...cached, cached: true };
    }

    const [currentRaw, forecastRaw] = await Promise.all([
      this.provider.fetchCurrent(location.latitude, location.longitude, units),
      this.provider.fetchForecast(location.latitude, location.longitude, units),
    ]);

    const current = toCurrentConditions(currentRaw);
    const hourly = toHourlyForecast(forecastRaw);
    const daily = toDailySummaries(forecastRaw);
    const advisories = deriveAdvisories(current, hourly, units);

    const report: WeatherReport = {
      location,
      units,
      current,
      hourly,
      daily,
      advisories,
      generatedAtIso: new Date().toISOString(),
      cached: false,
    };

    await this.cacheService.set(cacheKey, report, this.cacheTtlSeconds);
    this.recordSearchAsync(location, units, false);
    return report;
  }

  private async resolveLocation(query: WeatherQueryDto): Promise<GeocodedLocation> {
    if (typeof query.lat === 'number' && typeof query.lon === 'number') {
      return {
        name: `${query.lat.toFixed(2)},${query.lon.toFixed(2)}`,
        country: '',
        latitude: query.lat,
        longitude: query.lon,
      };
    }
    if (!query.q) {
      throw new BadRequestException('Provide either "q" or both "lat" and "lon"');
    }
    const matches = await this.provider.geocode(query.q);
    return matches[0];
  }

  private cacheKey(loc: GeocodedLocation, units: TemperatureUnit): string {
    const lat = loc.latitude.toFixed(3);
    const lon = loc.longitude.toFixed(3);
    return `weather:${units}:${lat}:${lon}`;
  }

  private recordSearchAsync(
    location: GeocodedLocation,
    units: TemperatureUnit,
    fromCache: boolean,
  ): void {
    this.analyticsService
      .recordSearch({ location, units, fromCache })
      .catch((err) =>
        this.logger.warn(
          { msg: 'analytics_write_failed', error: err },
          WeatherService.name,
        ),
      );
  }
}

