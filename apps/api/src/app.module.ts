import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppConfig, loadConfig } from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { WinstonModule } from "nest-winston";
import { format, transports } from "winston";
import { MongooseModule } from '@nestjs/mongoose';
import { Throttle, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { WeatherModule } from './weather/weather.module';
import { HealthModule } from './health/health.module';
import { HealthController } from './health/health.controller';
import { CacheModule } from './cache/cache.module';
import { AnalyticsService } from './analytics/analytics.service';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [loadConfig],
			validate: validateEnv
		}),
		WinstonModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService<AppConfig, true>) => ({
				level: config.get("nodeEnv", { infer: true }) === "production" ? "info" : "debug",
				format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
				transports: [
					new transports.Console({
						format: config.get("nodeEnv", { infer: true }) === "production" ? format.json() : format.combine(format.colorize(), format.simple())
					})
				]
			}),
		}),
		MongooseModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService<AppConfig, true>) => ({
				uri: config.get("mongoUri", { infer: true })
			})
		}),
		ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => [
        {
          ttl: config.get('throttle.ttl', { infer: true }) * 1000,
          limit: config.get('throttle.limit', { infer: true }),
        },
      ],
    }),
		HealthModule,
		WeatherModule,
		CacheModule,
		AnalyticsModule,
	],
	providers: [ {provide: APP_GUARD, useClass: ThrottlerGuard}, AnalyticsService]
})
export class AppModule {}