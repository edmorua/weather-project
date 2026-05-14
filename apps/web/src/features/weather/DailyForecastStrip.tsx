import { formatDay, formatTemperature, iconUrl } from './format';
import { DailySummary } from './types';

interface Props {
  daily: DailySummary[];
  units: 'metric' | 'imperial';
}

export function DailyForecastStrip({ daily, units }: Props): JSX.Element {
  return (
    <section className="card" aria-label="Daily forecast">
      <h3 className="text-lg font-semibold mb-3">Next 5 days</h3>
      <ul className="divide-y divide-slate-200">
        {daily.map((d) => (
          <li key={d.dateIso} className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-700 w-32">{formatDay(d.dateIso)}</span>
            <img src={iconUrl(d.icon)} alt={d.description} width={40} height={40} />
            <span className="text-sm text-slate-500 flex-1 px-3 capitalize">{d.description}</span>
            <span className="text-sm font-medium">
              {formatTemperature(d.minTemperature, units)} /{' '}
              {formatTemperature(d.maxTemperature, units)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
