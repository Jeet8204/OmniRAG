import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
  document.body.innerHTML = `
    <div style="padding:2rem;font-family:sans-serif;color:red">
      <h2>Missing VITE_GOOGLE_CLIENT_ID</h2>
      <p>Add it to <code>frontend/.env</code> and restart <code>npm run dev</code></p>
    </div>
  `;
} else {
  createRoot(document.getElementById('root')!).render(
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  );
}