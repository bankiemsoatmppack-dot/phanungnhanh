
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Starting application mount...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('FATAL: Could not find #root element');
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Application mounted successfully');
} catch (error) {
  console.error('Error during mount:', error);
  rootElement.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
    <h1>Application Error</h1>
    <p>Failed to mount application. Check console for details.</p>
    <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">${error instanceof Error ? error.message : JSON.stringify(error)}</pre>
  </div>`;
}
