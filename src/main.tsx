import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister old service worker to clear stale cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    for (const reg of regs) {
      reg.unregister();
    }
  });
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
