import { render, screen } from '@testing-library/react';
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{Array.isArray(children) ? children[0] : children}</div>,
  Route: ({ element }) => element,
  Link: ({ children }) => <div>{children}</div>,
}), { virtual: true });

jest.mock('react-chartjs-2', () => ({
  Line: () => <div>Chart</div>,
}));

jest.mock('./services/api', () => ({
  getLatest: jest.fn(() => Promise.resolve({ data: { error: 'no data' } })),
  getRecommendation: jest.fn(() => Promise.resolve({ data: { error: 'no data' } })),
  getHistory: jest.fn(() => Promise.resolve({ data: [] })),
  getHistoryRange: jest.fn(() => Promise.resolve({ data: [] })),
  simulateStrategy: jest.fn(() => Promise.resolve({ data: { error: 'no data' } })),
  __esModule: true,
  default: {},
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
  },
  writable: true,
});

import App from './App';

test('renders navigation content', async () => {
  render(<App />);
  const linkElement = await screen.findByText(/Live Heart Signal/i);
  expect(linkElement).toBeInTheDocument();
});
