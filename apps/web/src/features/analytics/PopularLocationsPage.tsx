import { useQuery } from '@tanstack/react-query';

import { apiClient, describeError } from '../../lib/api-client';

interface PopularLocation {
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  count: number;
}

export function PopularLocationsPage(): JSX.Element {
  const { data, isLoading, error } = useQuery({
    queryKey: ['popular-locations'],
    queryFn: async (): Promise<PopularLocation[]> => {
      const res = await apiClient.get<PopularLocation[]>('/analytics/popular-locations');
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Trending locations</h1>
        <p className="text-sm text-slate-500">
          Anonymous aggregate of the most-searched places in the last 24 hours.
        </p>
      </header>

      {isLoading && <div className="card text-slate-500">Loading…</div>}
      {error && (
        <div role="alert" className="card bg-red-50 ring-red-200 text-red-700">
          {describeError(error)}
        </div>
      )}
      {data && data.length === 0 && (
        <div className="card text-slate-500">
          No searches yet — be the first by looking up a city on the Search page.
        </div>
      )}
      {data && data.length > 0 && (
        <ol className="card divide-y divide-slate-200">
          {data.map((row, index) => (
            <li key={`${row.locationName}-${row.latitude}-${row.longitude}`} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 w-6 text-right">#{index + 1}</span>
                <div>
                  <div className="font-medium">
                    {row.locationName}
                    {row.country && ` · ${row.country}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.latitude.toFixed(2)}, {row.longitude.toFixed(2)}
                  </div>
                </div>
              </div>
              <span className="text-sm font-medium text-slate-700">
                {row.count} {row.count === 1 ? 'search' : 'searches'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
