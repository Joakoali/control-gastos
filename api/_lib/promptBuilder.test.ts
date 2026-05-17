import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './promptBuilder';
import type { HouseholdPayload } from './promptBuilder';

const empty: HouseholdPayload = {
  householdId: 'TEST01',
  data: { code: 'TEST01', fixedExpenses: [], months: {} },
};

describe('buildSystemPrompt', () => {
  it('empty household produces valid JSON with months: {}', () => {
    const prompt = buildSystemPrompt(empty);
    const match = prompt.match(/\[DATOS DEL HOGAR\]\n({[\s\S]*?})\n\n/);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match![1]);
    expect(parsed.months).toEqual({});
  });

  it('includes all months from household data', () => {
    const payload: HouseholdPayload = {
      householdId: 'TEST01',
      data: {
        code: 'TEST01',
        fixedExpenses: [],
        months: {
          '2024-0': { expenses: [{ name: 'Súper', amount: 100, category: 'comida' }], incomeSources: [], savings: 0 },
          '2024-1': { expenses: [], incomeSources: [], savings: 500 },
        },
      },
    };
    const prompt = buildSystemPrompt(payload);
    expect(prompt).toContain('2024-0');
    expect(prompt).toContain('2024-1');
  });

  it('includes current date in ISO format', () => {
    const prompt = buildSystemPrompt(empty);
    const today = new Date().toISOString().split('T')[0];
    expect(prompt).toContain(today);
  });

  it('does not include UIDs, emails, or member arrays', () => {
    const payload: HouseholdPayload = {
      householdId: 'TEST01',
      data: {
        code: 'TEST01',
        ...(({ members: ['uid-abc-123', 'uid-def-456'], createdBy: 'uid-abc-123' }) as unknown as object),
        fixedExpenses: [],
        months: {},
      },
    };
    const prompt = buildSystemPrompt(payload);
    expect(prompt).not.toContain('uid-abc-123');
    expect(prompt).not.toContain('uid-def-456');
    expect(prompt).not.toContain('members');
    expect(prompt).not.toContain('createdBy');
  });
});
