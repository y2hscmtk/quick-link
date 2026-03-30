import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './sidepanel.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Side panel root element not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
