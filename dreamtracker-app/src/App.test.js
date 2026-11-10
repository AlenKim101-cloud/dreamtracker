import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
});

test('renders the dream journal', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /good morning, dreamer/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /save dream/i })).toBeInTheDocument();
});

test('saves a dream and keeps it in local storage', async () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText(/dream title/i), { target: { value: 'A floating garden' } });
  fireEvent.change(screen.getByLabelText(/tell the story/i), { target: { value: 'I wandered through a garden in the clouds.' } });
  fireEvent.click(screen.getByRole('button', { name: /save dream/i }));

  expect(await screen.findByRole('heading', { name: 'A floating garden' })).toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem('dreamtracker.entries'))).toHaveLength(1);
});
