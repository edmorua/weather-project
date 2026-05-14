import {
  BadGatewayException,
  HttpStatus,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppConfig } from '../../config/configuration';
import { GeocodedLocation, TemperatureUnit } from '../utils/weather.types';
import {
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
  OpenWeatherGeocodeResult,
} from './openweather.types';

export const WEATHER_PROVIDER = Symbol('WEATHER_PROVIDER');

export interface WeatherProvider {
  geocode(query: string): Promise<GeocodedLocation[]>;
  fetchCurrent(
    lat: number,
    lon: number,
    units: TemperatureUnit,
  ): Promise<OpenWeatherCurrentResponse>;
  fetchForecast(
    lat: number,
    lon: number,
    units: TemperatureUnit,
  ): Promise<OpenWeatherForecastResponse>;
}

@Injectable()
export class OpenWeatherProvider implements WeatherProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private static readonly DEFAULT_TIMEOUT_MS = 5000;

  constructor(
    config: ConfigService<AppConfig, true>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.apiKey = config.get('openweather.apiKey', { infer: true });
    this.baseUrl = config.get('openweather.baseUrl', { infer: true });
  }

  async geocode(query: string): Promise<GeocodedLocation[]> {
    const url = this.buildUrl('/geo/1.0/direct', { q: query, limit: '5' });
    const results = await this.request<OpenWeatherGeocodeResult[]>(url, 'geocode');
    if (results.length === 0) {
      throw new NotFoundException(`No locations found matching "${query}"`);
    }
    return results.map((result) => ({
      name: result.name,
      country: result.country,
      state: result.state,
      latitude: result.lat,
      longitude: result.lon,
    }));
  }

  fetchCurrent(
    lat: number,
    lon: number,
    units: TemperatureUnit,
  ): Promise<OpenWeatherCurrentResponse> {
    const url = this.buildUrl('/data/2.5/weather', {
      lat: lat.toString(),
      lon: lon.toString(),
      units,
    });
    return this.request<OpenWeatherCurrentResponse>(url, 'current');
  }

  fetchForecast(
    lat: number,
    lon: number,
    units: TemperatureUnit,
  ): Promise<OpenWeatherForecastResponse> {
    const url = this.buildUrl('/data/2.5/forecast', {
      lat: lat.toString(),
      lon: lon.toString(),
      units,
    });
    return this.request<OpenWeatherForecastResponse>(url, 'forecast');
  }

  private buildUrl(path: string, params: Record<string, string>): string {
    const url = new URL(path, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set('appid', this.apiKey);
    return url.toString();
  }

  private async request<T>(url: string, op: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      OpenWeatherProvider.DEFAULT_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (response.status === HttpStatus.NOT_FOUND) {
        throw new NotFoundException('Upstream weather provider could not find that location');
      }
      if (response.status === HttpStatus.UNAUTHORIZED || response.status === HttpStatus.FORBIDDEN) {
        this.logger.error(
          { msg: 'openweather_auth_failed', status: response.status, op },
          OpenWeatherProvider.name,
        );
        throw new ServiceUnavailableException('Weather service is misconfigured');
      }
      if (response.status === HttpStatus.TOO_MANY_REQUESTS) {
        throw new ServiceUnavailableException(
          'Weather provider rate limit reached, please retry shortly',
        );
      }
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        this.logger.error(
          { msg: 'openweather_failed', status: response.status, op, body: text },
          OpenWeatherProvider.name,
        );
        throw new BadGatewayException('Upstream weather provider returned an error');
      }
      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      if (
        err instanceof BadGatewayException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ServiceUnavailableException('Weather provider request timed out');
      }
      this.logger.error(
        { msg: 'openweather_unknown_error', op, error: err },
        OpenWeatherProvider.name,
      );
      throw new BadGatewayException('Unexpected error talking to weather provider');
    } finally {
      clearTimeout(timeout);
    }
  }
}
