import { compassDirection, formatTemperature, formatTime, formatWind, iconUrl } from './format';
import { WeatherReport } from './types';

interface Props {
  report: WeatherReport;
}

export function CurrentConditionsCard({ report }: Props): JSX.Element {
  const { location, current, units, cached, generatedAtIso } = report;
  return (
    <section className="card" aria-label="Current conditions">
      <header>
        <h2 className="text-2xl font-semibold">
          {location.name}
          {location.state ? `, ${location.state}` : ''}
          {location.country ? `, ${location.country}` : ''}
        </h2>
        <p className="text-sm text-slate-500">
          Observed {formatTime(current.observedAtIso)} · generated{' '}
          {formatTime(generatedAtIso)} · {cached ? 'from cache' : 'fresh'}
        </p>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-6">
        <img
          src={iconUrl(current.icon)}
          alt={current.description}
          width={96}
          height={96}
          className="select-none"
        />
        <div>
          <div className="text-5xl font-bold tracking-tight">
            {formatTemperature(current.temperature, units)}
          </div>
          <div className="text-slate-500 capitalize">{current.description}</div>
          <div className="text-sm text-slate-500">
            Feels like {formatTemperature(current.feelsLike, units)}
          </div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <Metric label="Humidity" value={`${current.humidity}%`} />
        <Metric
          label="Wind"
          value={`${formatWind(current.windSpeed, units)} ${compassDirection(current.windDirectionDeg)}`}
        />
        <Metric label="Pressure" value={`${current.pressure} hPa`} />
        <Metric label="Cloud cover" value={`${current.cloudsPercent}%`} />
        <Metric label="Visibility" value={`${(current.visibilityMeters / 1000).toFixed(1)} km`} />
        <Metric label="Sunrise" value={formatTime(current.sunriseIso)} />
        <Metric label="Sunset" value={formatTime(current.sunsetIso)} />
      </dl>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
