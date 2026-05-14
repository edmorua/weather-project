export const formatTemperature = (value: number, units: 'metric' | 'imperial'): string =>
  `${Math.round(value)}°${units === 'metric' ? 'C' : 'F'}`;

export const formatWind = (value: number, units: 'metric' | 'imperial'): string =>
  `${value.toFixed(1)} ${units === 'metric' ? 'm/s' : 'mph'}`;

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export const formatDay = (iso: string): string =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

export const iconUrl = (code: string): string =>
  `https://openweathermap.org/img/wn/${code}@2x.png`;

export const compassDirection = (deg: number): string => {
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return labels[Math.round(((deg % 360) / 45)) % labels.length];
};
