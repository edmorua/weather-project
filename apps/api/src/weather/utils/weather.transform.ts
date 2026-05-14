import {
  OpenWeatherCurrentResponse,
  OpenWeatherForecastEntry,
  OpenWeatherForecastResponse,
} from '../providers/openweather.types';
import {
  CurrentConditions,
  DailySummary,
  ForecastEntry,
  WeatherAdvisory,
} from './weather.types';

const isoFromEpoch = (epochSeconds: number): string =>
  new Date(epochSeconds * 1000).toISOString();

export function toCurrentConditions(raw: OpenWeatherCurrentResponse): CurrentConditions {
  const primary = raw.weather[0];
  return {
    temperature: raw.main.temp,
    feelsLike: raw.main.feels_like,
    humidity: raw.main.humidity,
    pressure: raw.main.pressure,
    windSpeed: raw.wind.speed,
    windDirectionDeg: raw.wind.deg,
    cloudsPercent: raw.clouds.all,
    visibilityMeters: raw.visibility,
    description: primary?.description ?? 'unknown',
    icon: primary?.icon ?? '01d',
    sunriseIso: isoFromEpoch(raw.sys.sunrise),
    sunsetIso: isoFromEpoch(raw.sys.sunset),
    observedAtIso: isoFromEpoch(raw.dt),
  };
}

export function toHourlyForecast(raw: OpenWeatherForecastResponse): ForecastEntry[] {
  return raw.list.slice(0, 8).map(
    (entry): ForecastEntry => ({
      timestampIso: isoFromEpoch(entry.dt),
      temperature: entry.main.temp,
      feelsLike: entry.main.feels_like,
      humidity: entry.main.humidity,
      windSpeed: entry.wind.speed,
      description: entry.weather[0]?.description ?? 'unknown',
      icon: entry.weather[0]?.icon ?? '01d',
      precipitationProbability: entry.pop,
    }),
  );
}

/**
 * OpenWeather's free tier returns 3-hour windows for 5 days. We collapse them
 * into per-day summaries so the UI can render a forecast strip cleanly.
 */
export function toDailySummaries(raw: OpenWeatherForecastResponse): DailySummary[] {
  const byDate = new Map<string, OpenWeatherForecastEntry[]>();
  raw.list.forEach((entry) => {
    const dateIso = entry.dt_txt.slice(0, 10);
    const bucket = byDate.get(dateIso);
    if (bucket) bucket.push(entry);
    else byDate.set(dateIso, [entry]);
  });

  return Array.from(byDate.entries())
    .map(([dateIso, entries]): DailySummary => {
      const temps = entries.map((e) => e.main.temp);
      // Pick the description from the entry closest to local noon for relevance.
      const noonish = entries.reduce((best, e) => {
        const hour = parseInt(e.dt_txt.slice(11, 13), 10);
        const bestHour = parseInt(best.dt_txt.slice(11, 13), 10);
        return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? e : best;
      });
      return {
        dateIso,
        minTemperature: Math.min(...temps),
        maxTemperature: Math.max(...temps),
        description: noonish.weather[0]?.description ?? 'unknown',
        icon: noonish.weather[0]?.icon ?? '01d',
      };
    })
    .slice(0, 5);
}

/**
 * Business rules that turn raw numbers into actionable guidance.
 * This is intentionally simple but demonstrates "value beyond proxying".
 */
export function deriveAdvisories(
  current: CurrentConditions,
  hourly: ForecastEntry[],
  units: 'metric' | 'imperial',
): WeatherAdvisory[] {
  const advisories: WeatherAdvisory[] = [];
  const isCelsius = units === 'metric';
  const freezing = isCelsius ? 0 : 32;
  const veryHot = isCelsius ? 35 : 95;
  const strongWind = isCelsius ? 14 : 31; // m/s vs mph (~50 km/h)

  if (current.temperature <= freezing) {
    advisories.push({
      level: 'warning',
      title: 'Freezing temperatures',
      detail: `It's ${current.temperature.toFixed(0)}° outside — dress warmly and watch for icy surfaces.`,
    });
  }
  if (current.temperature >= veryHot) {
    advisories.push({
      level: 'warning',
      title: 'Heat advisory',
      detail: `Extreme heat (${current.temperature.toFixed(0)}°). Hydrate and avoid prolonged sun exposure.`,
    });
  }
  if (current.windSpeed >= strongWind) {
    advisories.push({
      level: 'warning',
      title: 'High winds',
      detail: `Sustained wind of ${current.windSpeed.toFixed(0)} — secure outdoor items.`,
    });
  }

  const rainSoon = hourly.slice(0, 3).find((h) => h.precipitationProbability >= 0.5);
  if (rainSoon) {
    advisories.push({
      level: 'info',
      title: 'Rain likely soon',
      detail: `~${Math.round(rainSoon.precipitationProbability * 100)}% chance of precipitation by ${new Date(
        rainSoon.timestampIso,
      ).toLocaleTimeString([], { hour: 'numeric' })}.`,
    });
  }

  if (current.visibilityMeters > 0 && current.visibilityMeters < 1000) {
    advisories.push({
      level: 'warning',
      title: 'Low visibility',
      detail: 'Visibility under 1 km — drive carefully.',
    });
  }

  return advisories;
}
