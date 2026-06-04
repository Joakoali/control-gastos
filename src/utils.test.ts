import { describe, it, expect } from 'vitest';
import { parseKey, compareMonthKeys, resolveForMonth, resolveRunningBalance } from './utils';
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
  ({ incomeSources: [], expenses: [], ...over });

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

describe('resolveRunningBalance', () => {
  it('devuelve 0 si months es undefined', () => {
    expect(resolveRunningBalance(undefined, '2025-5')).toBe(0);
  });

  it('devuelve 0 si no hay meses en o antes del target', () => {
    const months = { '2025-8': mk({ expenses: [] }) };
    expect(resolveRunningBalance(months, '2025-5')).toBe(0);
  });

  it('devuelve el savings explícito del mes target', () => {
    const months = { '2025-5': mk({ savings: 3500 }) };
    expect(resolveRunningBalance(months, '2025-5')).toBe(3500);
  });

  it('acumula el quedaMes positivo del mes anterior', () => {
    const months = {
      '2025-3': mk({
        savings: 3500,
        incomeSources: [{ id: 'i1', name: 'Sueldo', amount: 2800 }],
        expenses: [{ id: 'e1', name: 'Compra', amount: 900, category: 'otros', date: '2025-04-01' }],
      }),
      '2025-4': mk({ expenses: [] }),
    };
    expect(resolveRunningBalance(months, '2025-4')).toBe(5400);
  });

  it('resta el quedaMes negativo (mes con gastos mayores a ingresos)', () => {
    const months = {
      '2025-3': mk({
        savings: 3500,
        incomeSources: [{ id: 'i1', name: 'Sueldo', amount: 2000 }],
        expenses: [{ id: 'e1', name: 'Compra', amount: 2500, category: 'otros', date: '2025-04-01' }],
      }),
      '2025-4': mk({ expenses: [] }),
    };
    expect(resolveRunningBalance(months, '2025-4')).toBe(3000);
  });

  it('un override explícito resetea la base y el mes siguiente hereda override + quedaMes', () => {
    const months = {
      '2025-3': mk({
        savings: 5000,
        incomeSources: [{ id: 'i1', name: 'Sueldo', amount: 2000 }],
        expenses: [{ id: 'e1', name: 'X', amount: 500, category: 'otros', date: '2025-04-01' }],
      }),
      '2025-4': mk({
        savings: 2000,
        incomeSources: [{ id: 'i2', name: 'Sueldo', amount: 2800 }],
        expenses: [{ id: 'e2', name: 'Y', amount: 800, category: 'otros', date: '2025-05-01' }],
      }),
      '2025-5': mk({ expenses: [] }),
    };
    expect(resolveRunningBalance(months, '2025-5')).toBe(4000);
  });

  it('los meses sin datos en el mapa se saltan con quedaMes=0', () => {
    const months = {
      '2025-2': mk({ savings: 1000 }),
      '2025-4': mk({ expenses: [] }),
    };
    expect(resolveRunningBalance(months, '2025-4')).toBe(1000);
  });

  it('usa resolveForMonth para los fijos heredados al calcular quedaMes histórico', () => {
    const months = {
      '2025-2': mk({
        fixedExpenses: [{ id: 'f1', name: 'Alquiler', amount: 600 }],
      }),
      '2025-3': mk({
        savings: 3000,
        incomeSources: [{ id: 'i1', name: 'Sueldo', amount: 2000 }],
        expenses: [{ id: 'e1', name: 'X', amount: 500, category: 'otros', date: '2025-04-01' }],
      }),
      '2025-4': mk({ expenses: [] }),
    };
    expect(resolveRunningBalance(months, '2025-4')).toBe(3900);
  });
});
