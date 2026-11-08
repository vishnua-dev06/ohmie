import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { Dashboard } from './Dashboard';
import { AppContext } from '../lib/context';
import { previewPet, useOhmieStore } from '../lib/store';

describe('dashboard', () => {
  beforeEach(() => useOhmieStore.setState({ pet: { ...previewPet }, timeline: [], interaction: null }));

  it('shows the check-in dashboard and applies a pet interaction', () => {
    render(<AppContext.Provider value={{ user: null, setUser: () => undefined, cloudReady: false, connection: 'preview' }}><MemoryRouter><Dashboard/></MemoryRouter></AppContext.Provider>);
    expect(screen.getByText('How Ohmie’s doing')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /give a pet/i }));
    expect(useOhmieStore.getState().pet.happiness).toBe(84);
    expect(useOhmieStore.getState().pet.friendship).toBe(51);
  });
});
