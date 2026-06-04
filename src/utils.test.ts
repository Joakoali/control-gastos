import { describe, it, expect } from 'vitest';
import { parseKey, compareMonthKeys, resolveForMonth } from './utils';
import type { MonthData } from './types';

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

const mk = (over: Partial<MonthData>): MonthData =>
  ({ incomeSources: [], savings: 0, expenses: [], ...over });

describe('resolveForMonth', () => {
  it('devuelve el valor propio del mes si existe', () => {
    const months = { '2025-5': mk({ savings: 100 }) };
    expect(resolveForMonth(months, '2025-5', 'savings', 0)).toBe(100);
  });

  it('hereda del mes anterior más cercano cuando el mes no tiene valor propio', () => {
    const months: Record<string, Partial<MonthData>> = {
      '2025-3': mk({ savings: 50 }),
      '2025-6': { ...mk({ expenses: [] }), savings: undefined },
    };
    expect(resolveForMonth(months as Record<string, MonthData>, '2025-6', 'savings', 0)).toBe(50);
  });

  it('no hereda de meses futuros', () => {
    const months = { '2025-8': mk({ savings: 999 }) };
    expect(resolveForMonth(months, '2025-5', 'savings', 0)).toBe(0);
  });

  it('devuelve el fallback cuando no hay ningún antecesor con valor', () => {
    const months = { '2025-2': mk({ expenses: [] }) };
    expect(resolveForMonth(months, '2025-2', 'fixedExpenses', [])).toEqual([]);
  });

  it('respeta savings explícito en 0 (no lo trata como ausente)', () => {
    const months = {
      '2025-1': mk({ savings: 300 }),
      '2025-2': mk({ savings: 0 }),
    };
    expect(resolveForMonth(months, '2025-2', 'savings', 99)).toBe(0);
  });

  it('cruza años correctamente al caminar hacia atrás', () => {
    const months = {
      '2025-11': mk({ fixedExpenses: [{ id: 'a', name: 'Alquiler', amount: 800 }] }),
    };
    const r = resolveForMonth(months, '2026-1', 'fixedExpenses', []);
    expect(r).toHaveLength(1);
    expect(r[0].amount).toBe(800);
  });

  it('devuelve fallback si months es undefined', () => {
    expect(resolveForMonth(undefined, '2025-5', 'savings', 0)).toBe(0);
  });
});
