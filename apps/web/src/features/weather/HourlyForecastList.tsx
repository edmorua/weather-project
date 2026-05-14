import { formatTemperature, formatTime, iconUrl } from './format';
import { ForecastEntry } from './types';

interface Props {
  hourly: ForecastEntry[];
  units: 'metric' | 'imperial';
}

export function HourlyForecastList({ hourly, units }: Props): JSX.Element {
  return (
    <section className="card" aria-label="Hourly forecast">
      <h3 className="text-lg font-semibold mb-3">Next hours</h3>
      <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {hourly.map((h) => (
          <li
            key={h.timestampIso}
            className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3 text-center"
          >
            <div className="text-xs text-slate-500">{formatTime(h.timestampIso)}</div>
            <img
              src={iconUrl(h.icon)}
              alt={h.description}
              width={48}
              height={48}
              className="mx-auto"
            />
            <div className="font-semibold">{formatTemperature(h.temperature, units)}</div>
            <div className="text-xs text-slate-500">
              {Math.round(h.precipitationProbability * 100)}% rain
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
