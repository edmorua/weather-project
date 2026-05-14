import { ApiProperty } from '@nestjs/swagger';

import {
  CurrentConditions,
  DailySummary,
  ForecastEntry,
  GeocodedLocation,
  WeatherAdvisory,
  WeatherReport,
} from '../domain/weather.types';

export class GeocodedLocationDto implements GeocodedLocation {
  @ApiProperty() name!: string;
  @ApiProperty() country!: string;
  @ApiProperty({ required: false }) state?: string;
  @ApiProperty() latitude!: number;
  @ApiProperty() longitude!: number;
}

export class CurrentConditionsDto implements CurrentConditions {
  @ApiProperty() temperature!: number;
  @ApiProperty() feelsLike!: number;
  @ApiProperty() humidity!: number;
  @ApiProperty() pressure!: number;
  @ApiProperty() windSpeed!: number;
  @ApiProperty() windDirectionDeg!: number;
  @ApiProperty() cloudsPercent!: number;
  @ApiProperty() visibilityMeters!: number;
  @ApiProperty() description!: string;
  @ApiProperty() icon!: string;
  @ApiProperty() sunriseIso!: string;
  @ApiProperty() sunsetIso!: string;
  @ApiProperty() observedAtIso!: string;
}

export class ForecastEntryDto implements ForecastEntry {
  @ApiProperty() timestampIso!: string;
  @ApiProperty() temperature!: number;
  @ApiProperty() feelsLike!: number;
  @ApiProperty() humidity!: number;
  @ApiProperty() windSpeed!: number;
  @ApiProperty() description!: string;
  @ApiProperty() icon!: string;
  @ApiProperty({ description: 'Probability of precipitation, 0..1' })
  precipitationProbability!: number;
}

export class DailySummaryDto implements DailySummary {
  @ApiProperty() dateIso!: string;
  @ApiProperty() minTemperature!: number;
  @ApiProperty() maxTemperature!: number;
  @ApiProperty() description!: string;
  @ApiProperty() icon!: string;
}

export class WeatherAdvisoryDto implements WeatherAdvisory {
  @ApiProperty({ enum: ['info', 'warning', 'severe'] })
  level!: 'info' | 'warning' | 'severe';
  @ApiProperty() title!: string;
  @ApiProperty() detail!: string;
}

export class WeatherReportDto implements WeatherReport {
  @ApiProperty({ type: GeocodedLocationDto }) location!: GeocodedLocationDto;
  @ApiProperty({ enum: ['metric', 'imperial'] }) units!: 'metric' | 'imperial';
  @ApiProperty({ type: CurrentConditionsDto }) current!: CurrentConditionsDto;
  @ApiProperty({ type: [ForecastEntryDto] }) hourly!: ForecastEntryDto[];
  @ApiProperty({ type: [DailySummaryDto] }) daily!: DailySummaryDto[];
  @ApiProperty({ type: [WeatherAdvisoryDto] }) advisories!: WeatherAdvisoryDto[];
  @ApiProperty() generatedAtIso!: string;
  @ApiProperty() cached!: boolean;
}
