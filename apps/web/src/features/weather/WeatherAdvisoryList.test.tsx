import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WeatherAdvisoryList } from './WeatherAdvisoryList';

describe('WeatherAdvisoryList', () => {
  it('renders nothing when there are no advisories', () => {
    const { container } = render(<WeatherAdvisoryList advisories={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each advisory with its title and detail', () => {
    render(
      <WeatherAdvisoryList
        advisories={[
          { level: 'warning', title: 'High winds', detail: 'Secure outdoor items.' },
          { level: 'info', title: 'Rain likely soon', detail: '70% chance by 3 PM.' },
        ]}
      />,
    );
    expect(screen.getByText('High winds')).toBeInTheDocument();
    expect(screen.getByText('Rain likely soon')).toBeInTheDocument();
    expect(screen.getByText(/70% chance/)).toBeInTheDocument();
  });
});
