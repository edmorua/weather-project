import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import { CustomExceptionFilter } from "./common/filters/custom-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";


async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true });
	const logger = app.get(WINSTON_MODULE_NEST_PROVIDER)
	const configService = app.get(ConfigService);

	app.use(helmet());
	app.enableCors({
		origin: configService.get<string>("cors.origin", { infer: true }),
		credentials: false,
	});

	app.setGlobalPrefix("api");
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: "1",
	});

	app.useGlobalPipes( new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true,
		transformOptions: {
			enableImplicitConversion: true,
		},
	}))

	app.useGlobalFilters(new CustomExceptionFilter(logger));
	app.useGlobalInterceptors(new LoggingInterceptor(logger));
	const swaggerConfig = new DocumentBuilder()
		.setTitle('Weather API Documentation')
		.setDescription('REST API serving weather data via OpenWeather, backed by a MongoDB' + 
			'TTL response cache. Exposes an anonymous popular-locations analytics endpoint.'
		)
		.setVersion('1.0')
		.addTag('weather', 'Current Conditions, forecast, geocoding')
		.addTag('analytics', 'anonymous analytics on popular locations')
		.addTag('health', 'health check endpoint')
		.build();
	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup('api/docs', app, document);
	

	const port = configService.get("port", { infer: true });
	await app.listen(port);
	logger.log(`Application is running on: http://localhost:${port}/api`, 'docs at api/docs', 'Bootstrap');
}

bootstrap().catch((error) => {
	console.error("Error starting the application", error);
	process.exit(1);
})