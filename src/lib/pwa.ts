export const INSTALL_REMINDER_DELAY = 604800000;
export function isPreviewHost(host: string) {
  const hostname = host.toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1'
    || /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+\.(?:lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(hostname)
    || /^project--f54fe142-74fb-4cf0-98d7-310265e610a6-dev\.(?:lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(hostname)
    || ['lovableproject.com', 'lovableproject-dev.com', 'beta.lovable.dev'].some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}
export function shouldOfferInstall(installed: boolean, dismissedAt: number, now: number) {
  return !installed && (!dismissedAt || now - dismissedAt >= INSTALL_REMINDER_DELAY);
}
export function isStaticAsset(url: URL, origin: string) {
  return url.origin === origin && /^\/assets\/[^/]+-[a-zA-Z0-9_-]{8,}\.(?:js|css|woff2?|png|jpg|webp)$/.test(url.pathname);
}
