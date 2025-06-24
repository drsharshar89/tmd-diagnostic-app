import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

// Production-ready initialization

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Hide the loading indicator when React mounts
setTimeout(() => {
  const loader = document.getElementById('loading-indicator');
  if (loader) loader.style.display = 'none';
  // React mount completed
}, 100);
