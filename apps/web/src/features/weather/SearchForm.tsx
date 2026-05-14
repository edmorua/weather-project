import { useState } from 'react';

export interface SearchSubmission {
  q: string;
  units: 'metric' | 'imperial';
}

interface SearchFormProps {
  onSearch: (submission: SearchSubmission) => void;
  onUseGeolocation: () => void;
}

export function SearchForm({ onSearch, onUseGeolocation }: SearchFormProps): JSX.Element {
  const [q, setQ] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>('imperial');

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    onSearch({ q: trimmed, units });
  };

  return (
    <form className="card" onSubmit={onSubmit}>
      <label className="label" htmlFor="locationQuery">
        Where do you want to check the weather?
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="locationQuery"
          className="input flex-1"
          placeholder='Try "Charleston, SC" or "Tokyo"'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <div
          role="radiogroup"
          aria-label="Temperature units"
          className="inline-flex rounded-lg border border-slate-300 overflow-hidden"
        >
          {(['imperial', 'metric'] as const).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={units === u}
              onClick={() => setUnits(u)}
              className={`px-3 py-2 text-sm ${
                units === u ? 'bg-brand text-white' : 'bg-white text-slate-700'
              }`}
            >
              {u === 'imperial' ? '°F' : '°C'}
            </button>
          ))}
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
      </div>
      <div className="mt-3 flex justify-end">
        <button type="button" className="text-sm text-brand hover:underline" onClick={onUseGeolocation}>
          Use my current location
        </button>
      </div>
    </form>
  );
}
