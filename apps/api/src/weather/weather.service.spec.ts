import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AnalyticsService } from '../analytics/analytics.service';
import { CacheService } from '../cache/cache.service';
import { OpenWeatherProvider } from './providers/openweather.provider';
import { WeatherService } from './weather.service';

const sampleCurrent = {
  coord: { lon: -79.93, lat: 32.77 },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  main: { temp: 72, feels_like: 70, pressure: 1013, humidity: 50, temp_min: 70, temp_max: 75 },
  visibility: 10000,
  wind: { speed: 5, deg: 180 },
  clouds: { all: 0 },
  dt: 1700000000,
  sys: { country: 'US', sunrise: 1699970000, sunset: 1700013000 },
  timezone: 0,
  id: 1,
  name: 'Charleston',
};

const sampleForecast = {
  city: { name: 'Charleston', country: 'US', sunrise: 1699970000, sunset: 1700013000 },
  list: [
    {
      dt: 1700003600,
      main: { temp: 70, feels_like: 70, humidity: 50, temp_min: 65, temp_max: 75 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      wind: { speed: 4, deg: 100 },
      pop: 0.1,
      dt_txt: '2024-01-01 12:00:00',
    },
  ],
};

describe('WeatherService', () => {
  let weatherService: WeatherService;
  let provider: jest.Mocked<OpenWeatherProvider>;
  let cache: jest.Mocked<CacheService>;
  let analytics: jest.Mocked<AnalyticsService>;

  beforeEach(async () => {
    provider = {
      geocode: jest.fn(),
      fetchCurrent: jest.fn(),
      fetchForecast: jest.fn(),
    } as unknown as jest.Mocked<OpenWeatherProvider>;
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;
    analytics = {
      recordSearch: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AnalyticsService>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: OpenWeatherProvider, useValue: provider },
        { provide: CacheService, useValue: cache },
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: ConfigService,
          useValue: { get: (k: string) => (k === 'cache.weatherTtlSeconds' ? 60 : undefined) },
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        },
      ],
    }).compile();

    weatherService = moduleRef.get(WeatherService);
  });

  it('serves report from cache when available and marks cached:true', async () => {
    cache.get.mockResolvedValue({
      location: { name: 'Charleston', country: 'US', latitude: 32.77, longitude: -79.93 },
      units: 'imperial',
      current: {} as never,
      hourly: [],
      daily: [],
      advisories: [],
      generatedAtIso: '2024-01-01T00:00:00.000Z',
      cached: false,
    });

    const result = await weatherService.getReport({ lat: 32.77, lon: -79.93 });
    expect(result.cached).toBe(true);
    expect(provider.fetchCurrent).not.toHaveBeenCalled();
  });

  it('fetches and caches on cache miss', async () => {
    cache.get.mockResolvedValue(null);
    provider.fetchCurrent.mockResolvedValue(sampleCurrent);
    provider.fetchForecast.mockResolvedValue(sampleForecast);

    const result = await weatherService.getReport({ lat: 32.77, lon: -79.93 });
    expect(result.cached).toBe(false);
    expect(cache.set).toHaveBeenCalled();
    expect(analytics.recordSearch).toHaveBeenCalledWith(
      expect.objectContaining({ fromCache: false }),
    );
  });

  it('rejects when neither q nor coords are provided', async () => {
    cache.get.mockResolvedValue(null);
    await expect(weatherService.getReport({})).rejects.toThrow(/Provide either/);
  });
});
