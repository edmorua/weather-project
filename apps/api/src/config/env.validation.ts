import { plainToInstance } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min, validateSync } from "class-validator";

class EnvironmentVariables {
	@IsEnum(["development", "production", "test"])
	@IsOptional()
	NODE_ENV?: "development" | "production" | "test";

	@IsInt()
	@Min(1)
	@IsOptional()
	API_PORT?: number;

	@IsString()
	MONGO_URI!: string;
	
	@IsString()
	OPENWEATHER_API_KEY!: string;	
}


export function validateEnv(rawEnv: Record<string, unknown>): EnvironmentVariables {
	const env = plainToInstance(EnvironmentVariables, rawEnv, {
		enableImplicitConversion: true,
	});
	const errors = validateSync(env, { skipMissingProperties: false });

	if (errors.length > 0) {
		throw new Error(`Config validation error: ${errors}`);
	}

	return env;
}
