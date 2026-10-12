import { describe,it,expect } from 'vitest';
import { isValidAccessCode,normalizeAccessCode,safeDestination } from '@/lib/access';
describe('Invitation access',()=>{
 it('requires exactly seven alphanumeric characters',()=>{expect(isValidAccessCode('LIDN82A')).toBe(true);expect(isValidAccessCode('LIDN82')).toBe(false);expect(isValidAccessCode('LIDN82AB')).toBe(false);expect(isValidAccessCode('LIDN8-A')).toBe(false);});
 it('normalizes code case',()=>expect(normalizeAccessCode(' lidn82a ')).toBe('LIDN82A'));
 it('never redirects to another origin',()=>{expect(safeDestination('//evil.test')).toBe('/inicio');expect(safeDestination('/\\evil.test')).toBe('/inicio');expect(safeDestination('/movimentacoes')).toBe('/movimentacoes');});
});
