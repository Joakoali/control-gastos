export interface BarChartData {
  type: 'bar';
  title?: string;
  data: { label: string; value: number }[];
  format?: 'currency' | 'percent' | 'number';
}

export interface CompareChartData {
  type: 'compare';
  title?: string;
  labels: string[];
  series: { name: string; values: number[] }[];
  format?: 'currency' | 'percent' | 'number';
}

export interface DonutChartData {
  type: 'donut';
  title?: string;
  data: { label: string; value: number }[];
  format?: 'currency' | 'percent' | 'number';
}

export type ChartData = BarChartData | CompareChartData | DonutChartData;

export type TextBlock = { type: 'text'; content: string };
export type ChartBlock = { type: 'chart'; raw: string; data: ChartData | null };
export type Block = TextBlock | ChartBlock;

function parseChartJson(raw: string): ChartData | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { type } = parsed;
    if (type === 'bar' || type === 'donut') {
      if (!Array.isArray(parsed.data)) return null;
      return parsed as BarChartData | DonutChartData;
    }
    if (type === 'compare') {
      if (!Array.isArray(parsed.labels) || !Array.isArray(parsed.series)) return null;
      return parsed as CompareChartData;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseChat(text: string): Block[] {
  const blocks: Block[] = [];
  const regex = /```chart\n([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(last, match.index);
    if (before) blocks.push({ type: 'text', content: before });
    const raw = match[1].trim();
    blocks.push({ type: 'chart', raw, data: parseChartJson(raw) });
    last = match.index + match[0].length;
  }

  const remaining = text.slice(last);
  if (remaining) blocks.push({ type: 'text', content: remaining });

  return blocks;
}
