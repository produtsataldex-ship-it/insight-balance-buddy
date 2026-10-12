export function normalizeAccessCode(value: string) { return value.trim().toUpperCase(); }
export function isValidAccessCode(value: string) { return /^[A-Z0-9]{7}$/.test(normalizeAccessCode(value)); }
export function safeDestination(value?: string) { return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/inicio'; }
