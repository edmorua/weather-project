export interface GeocodedLocation {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentConditions {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirectionDeg: number;
  cloudsPercent: number;
  visibilityMeters: number;
  description: string;
  icon: string;
  sunriseIso: string;
  sunsetIso: string;
  observedAtIso: string;
}

export interface ForecastEntry {
  timestampIso: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  precipitationProbability: number;
}

export interface DailySummary {
  dateIso: string;
  minTemperature: number;
  maxTemperature: number;
  description: string;
  icon: string;
}

export interface WeatherAdvisory {
  level: 'info' | 'warning' | 'severe';
  title: string;
  detail: string;
}

export interface WeatherReport {
  location: GeocodedLocation;
  units: 'metric' | 'imperial';
  current: CurrentConditions;
  hourly: ForecastEntry[];
  daily: DailySummary[];
  advisories: WeatherAdvisory[];
  generatedAtIso: string;
  cached: boolean;
}
