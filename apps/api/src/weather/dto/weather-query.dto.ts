import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from 'class-validator';

export class WeatherQueryDto {
	
  @ApiPropertyOptional({
    description: 'City, "City,Country", or "City,State,Country". Required if coordinates absent.',
    example: 'Charleston,SC,US',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional({ description: 'Latitude in decimal degrees', example: 32.7765 })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude in decimal degrees', example: -79.9311 })
  @IsOptional()
  @IsLongitude()
  lon?: number;

  @ApiPropertyOptional({ enum: ['metric', 'imperial'], default: 'imperial' })
  @IsOptional()
  @IsIn(['metric', 'imperial'])
  units?: 'metric' | 'imperial';
}
