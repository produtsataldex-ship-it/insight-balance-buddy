import { describe, expect, it } from 'vitest';
import { isPreviewHost, isStaticAsset, shouldOfferInstall, INSTALL_REMINDER_DELAY } from '../lib/pwa';
describe('Patrion installation safety', () => {
  it('suppresses invitations after installation', () => { expect(shouldOfferInstall(true, 0, 100)).toBe(false); });
  it('offers on the first eligible visit', () => { expect(shouldOfferInstall(false, 0, 100)).toBe(true); });
  it('waits seven days after dismissal', () => { expect(INSTALL_REMINDER_DELAY).toBe(604800000); expect(shouldOfferInstall(false, 100, 604800099)).toBe(false); expect(shouldOfferInstall(false, 100, 604800100)).toBe(true); });
  it.each(['id-preview--abc.lovable.app', 'preview-2--abc.gpt-eng.com', 'preview--abc.gptengineer.run', 'project--f54fe142-74fb-4cf0-98d7-310265e610a6-dev.lovable.app', 'a.lovableproject.com', 'lovableproject-dev.com', 'beta.lovable.dev', 'localhost'])('refuses preview worker on %s', host => { expect(isPreviewHost(host)).toBe(true); });
  it.each(['patriongestaofinanceiraprofissional.lovable.app', 'preview-v2--shop.example.com'])('allows published domain %s', host => { expect(isPreviewHost(host)).toBe(false); });
  it('only permits same-origin hashed static assets', () => { const origin = 'https://patrion.example'; expect(isStaticAsset(new URL(`${origin}/assets/app-12345678.js`), origin)).toBe(true); for (const path of ['/inicio', '/api/private', '/~oauth', '/assets/app.js']) expect(isStaticAsset(new URL(origin + path), origin)).toBe(false); expect(isStaticAsset(new URL('https://other.example/assets/app-12345678.js'), origin)).toBe(false); });
});
