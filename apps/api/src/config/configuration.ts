export interface AppConfig {

	nodeEnv: 'development' | 'production' | 'test';
	port: number;
	cors: { origin : string};
	mongoUri: string;
	openweather: {
		apiKey: string;
		baseUrl: string;
	}
	cache: {
    weatherTtlSeconds: number;
  };
	throttle: {
		ttl: number;
		limit: number;
	}
}


export const loadConfig = (): AppConfig => {
	return {
		nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
		port: parseInt(process.env.API_PORT || '3001', 10),
		cors: {
			origin: process.env.CORS_ORIGIN || '*',
		},
		mongoUri: process.env.MONGO_URI || '',
		openweather: {
			apiKey: process.env.OPENWEATHER_API_KEY || '',
			baseUrl: process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
		},
		cache: {
    weatherTtlSeconds: parseInt(process.env.WEATHER_CACHE_TTL_SECONDS ?? '600', 10),
  	},
		throttle: {
			ttl: parseInt(process.env.THROTTLE_TTL_SECONDS || '60', 10),
			limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
		},
	};
};