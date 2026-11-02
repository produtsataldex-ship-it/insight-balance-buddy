import { describe, expect, it } from 'vitest';
import { kindFromClientError, kindFromGatewayCode } from '@/lib/assistant-errors';

describe('assistant error classification', () => {
  it('only reports offline when the device is offline', () => {
    expect(kindFromClientError(new Error('Failed to fetch'), false)).toBe('offline');
    expect(kindFromClientError(new Error('Failed to fetch'), true)).toBe('server');
  });
  it('detects expired session', () => expect(kindFromClientError(Object.assign(new Error('x'), { status: 401 }), true)).toBe('auth'));
  it('maps gateway rate limit', () => expect(kindFromGatewayCode('rate_limited')).toBe('rate_limit'));
  it('maps gateway credits', () => expect(kindFromGatewayCode('payment_required')).toBe('credits'));
  it('maps gateway timeout', () => expect(kindFromGatewayCode('timeout')).toBe('timeout'));
});
