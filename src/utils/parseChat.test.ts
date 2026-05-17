import { describe, it, expect } from 'vitest';
import { parseChat } from './parseChat';

describe('parseChat', () => {
  it('text without charts returns 1 text block', () => {
    const result = parseChat('Hello world');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
  });

  it('1 chart in the middle returns 3 blocks', () => {
    const text = 'Before\n```chart\n{"type":"bar","data":[{"label":"A","value":100}]}\n```\nAfter';
    const result = parseChat(text);
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('text');
    expect(result[1].type).toBe('chart');
    expect(result[2].type).toBe('text');
  });

  it('chart with invalid JSON returns chart block with null data', () => {
    const text = '```chart\nnot valid json\n```';
    const result = parseChat(text);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('chart');
    if (result[0].type === 'chart') expect(result[0].data).toBeNull();
  });

  it('chart with unknown type returns chart block with null data', () => {
    const text = '```chart\n{"type":"pie","data":[]}\n```';
    const result = parseChat(text);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('chart');
    if (result[0].type === 'chart') expect(result[0].data).toBeNull();
  });

  it('multiple consecutive charts are all parsed', () => {
    const text = [
      '```chart\n{"type":"bar","data":[{"label":"A","value":1}]}\n```',
      '```chart\n{"type":"donut","data":[{"label":"B","value":2}]}\n```',
    ].join('\n');
    const result = parseChat(text);
    const charts = result.filter(b => b.type === 'chart');
    expect(charts).toHaveLength(2);
  });

  it('empty string returns no blocks', () => {
    const result = parseChat('');
    expect(result).toHaveLength(0);
  });
});
