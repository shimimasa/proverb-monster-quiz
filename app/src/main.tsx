import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/monster.css'
import App from './App.tsx'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline support
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('Service Worker registered successfully:', registration);
  },
  onUpdate: (registration) => {
    console.log('Service Worker update available:', registration);
    // Dispatch custom event that App component can listen to
    window.dispatchEvent(new CustomEvent('sw-update', { detail: registration }));
  },
  onError: (error) => {
    console.error('Service Worker registration failed:', error);
  }
});
