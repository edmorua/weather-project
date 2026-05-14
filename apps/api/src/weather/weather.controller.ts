import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { version } from 'node:os';
import path from 'node:path';

@ApiTags('weather')
@Controller({ path: "api/v1/weather", version: '1' })
export class WeatherController {

	constructor(private readonly weatherService: WeatherService) {}


	@Get('geocode')
	@ApiOperation({ summary: 'Geocode an address to get latitude and longitude' })
	@ApiOkResponse({ type: [GeocodedLocationDto]})
	geocode(@Query('q') q: string): Promise<GeocodedLocationDto[]> {
		return this.weatherService.geocode(q);
	}

	@Get('/')
	@ApiOperation({ summary: 'Get current weather conditions for a location' })
	@ApiOkResponse({ type: WeatherResponseDto })
	getCurrentWeather(@Query() query: WeatherQueryDto): Promise<WeatherResponseDto> {
		return this.weatherService.getCurrentWeather(query);
	}

	@Get('/forecast')
	@ApiOperation({ summary: 'Get 5 day / 3 hour forecast for a location' })
	@ApiOkResponse({ type: ForecastResponseDto })
	getForecast(@Query() query: WeatherQueryDto): Promise<ForecastResponseDto> {
		return this.weatherService.getForecast(query);
	}
}
