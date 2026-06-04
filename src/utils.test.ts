import { describe, it, expect } from 'vitest';
import { parseKey, compareMonthKeys } from './utils';

describe('parseKey', () => {
  it('parsea año y mes', () => {
    expect(parseKey('2025-0')).toEqual([2025, 0]);
    expect(parseKey('2025-11')).toEqual([2025, 11]);
  });
});

describe('compareMonthKeys', () => {
  it('ordena por año primero', () => {
    expect(compareMonthKeys('2025-11', '2026-0')).toBeLessThan(0);
    expect(compareMonthKeys('2026-0', '2025-11')).toBeGreaterThan(0);
  });

  it('ordena por mes dentro del mismo año (no como string)', () => {
    expect(compareMonthKeys('2025-11', '2025-2')).toBeGreaterThan(0);
  });

  it('devuelve 0 para claves iguales', () => {
    expect(compareMonthKeys('2025-5', '2025-5')).toBe(0);
  });
});
