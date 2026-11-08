import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Ohmie } from './Ohmie';
import type { Emotion } from '../lib/supabase';

describe('Ohmie character', () => {
  it('renders each of the nine consistent emotional states with an accessible label', () => {
    const emotions: Emotion[] = ['happy','sad','angry','surprised','sleeping','excited','tired','lonely','curious'];
    for (const emotion of emotions) {
      const { unmount } = render(<Ohmie emotion={emotion}/>);
      expect(screen.getByRole('img', { name: `Ohmie feeling ${emotion}` })).toBeInTheDocument();
      unmount();
    }
  });
});
