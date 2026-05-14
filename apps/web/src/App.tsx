import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { PopularLocationsPage } from './features/analytics/PopularLocationsPage';
import { WeatherPage } from './features/weather/WeatherPage';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<WeatherPage />} />
        <Route path="trending" element={<PopularLocationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
