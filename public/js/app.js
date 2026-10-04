
// Register the bookstore's root-scoped service worker in supported browsers.
if (typeof navigator !== 'undefined'
    && navigator.serviceWorker
    && typeof navigator.serviceWorker.register === 'function') {
  navigator.serviceWorker.register('/sw.js').catch((error) => {
    console.error('Service worker registration failed:', error);
  });
}
