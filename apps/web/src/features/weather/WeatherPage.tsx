import { useState } from 'react';

import { describeError } from '../../lib/api-client';
import { CurrentConditionsCard } from './CurrentConditionsCard';
import { DailyForecastStrip } from './DailyForecastStrip';
import { HourlyForecastList } from './HourlyForecastList';
import { SearchForm, SearchSubmission } from './SearchForm';
import { useWeather, WeatherQueryArgs } from './useWeather';
import { WeatherAdvisoryList } from './WeatherAdvisoryList';

export function WeatherPage(): JSX.Element {
  const [query, setQuery] = useState<WeatherQueryArgs | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const { data, isFetching, error } = useWeather(query);

  const onSearch = ({ q, units }: SearchSubmission): void => {
    setQuery({ q, units });
    setGeolocationError(null);
  };

  const onUseGeolocation = (): void => {
    if (!('geolocation' in navigator)) {
      setGeolocationError('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setQuery({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          units: query?.units ?? 'imperial',
        });
        setGeolocationError(null);
      },
      (err) => setGeolocationError(err.message),
      { timeout: 5000 },
    );
  };

  return (
    <div className="space-y-6">
      <SearchForm onSearch={onSearch} onUseGeolocation={onUseGeolocation} />

      {geolocationError && (
        <div role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {geolocationError}
        </div>
      )}

      {isFetching && (
        <div className="card animate-pulse text-center text-slate-500">Fetching weather…</div>
      )}

      {error && (
        <div role="alert" className="card bg-red-50 ring-red-200 text-red-700">
          {describeError(error)}
        </div>
      )}

      {data && (
        <>
          <CurrentConditionsCard report={data} />
          <WeatherAdvisoryList advisories={data.advisories} />
          <HourlyForecastList hourly={data.hourly} units={data.units} />
          <DailyForecastStrip daily={data.daily} units={data.units} />
        </>
      )}
    </div>
  );
}
