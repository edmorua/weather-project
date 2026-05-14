import clsx from 'clsx';

import { WeatherAdvisory } from './types';

const styleForLevel: Record<WeatherAdvisory['level'], string> = {
  info: 'bg-sky-50 ring-sky-200 text-sky-900',
  warning: 'bg-amber-50 ring-amber-200 text-amber-900',
  severe: 'bg-red-50 ring-red-300 text-red-900',
};

export function WeatherAdvisoryList({
  advisories,
}: {
  advisories: WeatherAdvisory[];
}): JSX.Element | null {
  if (advisories.length === 0) return null;
  return (
    <section aria-label="Advisories" className="space-y-2">
      {advisories.map((a, i) => (
        <div
          key={`${a.level}-${i}`}
          className={clsx('rounded-xl ring-1 px-4 py-3 text-sm', styleForLevel[a.level])}
        >
          <strong className="block">{a.title}</strong>
          <span>{a.detail}</span>
        </div>
      ))}
    </section>
  );
}
