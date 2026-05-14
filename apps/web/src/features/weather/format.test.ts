import { describe, expect, it } from 'vitest';

import { compassDirection, formatTemperature, formatWind } from './format';

describe('formatters', () => {
  it('formats temperature with the right unit', () => {
    expect(formatTemperature(71.6, 'imperial')).toBe('72°F');
    expect(formatTemperature(22.3, 'metric')).toBe('22°C');
  });

  it('formats wind speed for each unit system', () => {
    expect(formatWind(5.5, 'metric')).toBe('5.5 m/s');
    expect(formatWind(12.1, 'imperial')).toBe('12.1 mph');
  });

  it.each([
    [0, 'N'],
    [45, 'NE'],
    [90, 'E'],
    [180, 'S'],
    [270, 'W'],
    [359, 'N'],
  ])('translates %d° to %s on the compass', (deg, expected) => {
    expect(compassDirection(deg)).toBe(expected);
  });
});
