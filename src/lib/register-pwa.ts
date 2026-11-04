import { isPreviewHost } from './pwa';
/** The only app-shell registrar; production published origins only. */
export async function registerPatrionPwa() {
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD || window.self !== window.top || isPreviewHost(window.location.hostname) || new URLSearchParams(window.location.search).get('sw') === 'off') {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(registration => {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      if (!worker) return false;
      const url = new URL(worker.scriptURL);
      return url.origin === window.location.origin && url.pathname === '/sw.js';
    }).map(registration => registration.unregister()));
    return;
  }
  const { registerSW } = await import('virtual:pwa-register');
  // Auto-update without forcing reloads of forms or conversations.
  registerSW({ immediate: true, onRegisterError(error) { console.error('Patrion installation unavailable', error); } });
}
