import { Link, NavLink, Outlet } from 'react-router-dom';

const navItemClass = ({ isActive }: { isActive: boolean }): string =>
  `text-sm font-medium px-3 py-2 rounded-md ${
    isActive ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100'
  }`;

export function Layout(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block w-7 h-7 rounded-full bg-brand-accent" />
            <span className="font-semibold text-slate-900">Palmetto Weather</span>
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={navItemClass}>
              Search
            </NavLink>
            <NavLink to="/trending" className={navItemClass}>
              Trending
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Weather data &copy; OpenWeather. Built for the Palmetto take-home challenge.
      </footer>
    </div>
  );
}
