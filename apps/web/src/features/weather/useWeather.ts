import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';
import { WeatherReport } from './types';

export interface WeatherQueryArgs {
  q?: string;
  lat?: number;
  lon?: number;
  units: 'metric' | 'imperial';
}

const buildKey = (args: WeatherQueryArgs): unknown[] => [
  'weather',
  args.q ?? null,
  args.lat ?? null,
  args.lon ?? null,
  args.units,
];

export function useWeather(args: WeatherQueryArgs | null) {
  return useQuery({
    enabled: !!args && (!!args.q || (args.lat !== undefined && args.lon !== undefined)),
    queryKey: args ? buildKey(args) : ['weather', 'idle'],
    queryFn: async (): Promise<WeatherReport> => {
      const res = await apiClient.get<WeatherReport>('/weather', { params: args ?? undefined });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
