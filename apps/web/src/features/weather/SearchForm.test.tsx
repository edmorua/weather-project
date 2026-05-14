import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SearchForm } from './SearchForm';

describe('SearchForm', () => {
  it('submits the trimmed query and selected unit system', async () => {
    const onSearch = vi.fn();
    const onUseGeolocation = vi.fn();
    render(<SearchForm onSearch={onSearch} onUseGeolocation={onUseGeolocation} />);

    await userEvent.type(screen.getByLabelText(/where do you want/i), '  Charleston  ');
    await userEvent.click(screen.getByRole('radio', { name: '°C' }));
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(onSearch).toHaveBeenCalledWith({ q: 'Charleston', units: 'metric' });
  });

  it('ignores empty submissions', async () => {
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} onUseGeolocation={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('triggers geolocation request when the link is clicked', async () => {
    const onUseGeolocation = vi.fn();
    render(<SearchForm onSearch={vi.fn()} onUseGeolocation={onUseGeolocation} />);
    await userEvent.click(screen.getByRole('button', { name: /current location/i }));
    expect(onUseGeolocation).toHaveBeenCalled();
  });
});
