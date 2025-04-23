import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// --- Errly SDK Initialization ---
// Make sure you import or define setKey and patch from the Errly SDK
import { setKey, patch } from 'errly'; // Adjust import path as needed

const errlyApiKey = import.meta.env.VITE_ERRLY_API_KEY;

if (errlyApiKey) {
  setKey(errlyApiKey);
  patch(); // This adds console.text
  console.log('Errly SDK initialized with console.text().');
} else {
  // Warn if the key is missing, SDK won't send errors
  console.warn(
    'Errly API Key not found in environment variables (e.g., VITE_ERRLY_API_KEY). Errly SDK not fully functional.'
  );
}
// --- End Errly SDK Initialization ---

createRoot(document.getElementById("root")!).render(<App />);
