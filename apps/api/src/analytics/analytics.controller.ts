import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiOkResponse, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

import { AnalyticsService, PopularLocation } from './analytics.service';

class PopularLocationsQueryDto {
  @ApiPropertyOptional({ default: 24, minimum: 1, maximum: 168 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  windowHours?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

@ApiTags('analytics')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('popular-locations')
  @ApiOperation({
    summary: 'Most-searched locations within a recent time window (anonymous)',
  })
  @ApiOkResponse()
  popular(@Query() query: PopularLocationsQueryDto): Promise<PopularLocation[]> {
    return this.analyticsService.popularLocations(query.windowHours, query.limit);
  }
}
