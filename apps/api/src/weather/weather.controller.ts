import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeocodedLocationDto, WeatherResponseDto } from './dto/weather-response.dto';
import { WeatherQueryDto } from './dto/weather-query.dto';
import { WeatherService } from './weather.service';

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
