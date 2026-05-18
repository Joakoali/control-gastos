import type { ChartBlock as ChartBlockType, BarChartData, CompareChartData, DonutChartData } from '../../utils/parseChat';

const PALETTE = ['#7c3aed', '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626'];

function fmtValue(value: number, format?: string): string {
  if (format === 'currency') {
    return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  if (format === 'percent') return `${Math.round(value)}%`;
  return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BarChart({ title, data, format }: BarChartData) {
  const max = Math.max(...data.map(d => d.value), 0.01);
  return (
    <div className="my-2 p-4 bg-slate-50 rounded-xl">
      {title && <div className="text-sm font-bold text-slate-700 mb-3">{title}</div>}
      {data.map(({ label, value }) => (
        <div key={label} className="mb-2.5">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>{label}</span>
            <span className="font-semibold">{fmtValue(value, format)}</span>
          </div>
          <div className="h-5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
              style={{ width: `${Math.max((value / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompareChart({ title, labels, series, format }: CompareChartData) {
  const allValues = series.flatMap(s => s.values);
  const max = Math.max(...allValues, 0.01);

  return (
    <div className="my-2 p-4 bg-slate-50 rounded-xl">
      {title && <div className="text-sm font-bold text-slate-700 mb-3">{title}</div>}
      <div className="flex gap-3 mb-3 flex-wrap">
        {series.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            {s.name}
          </div>
        ))}
      </div>
      {labels.map((label, i) => (
        <div key={label} className="mb-3">
          <div className="text-xs font-medium text-slate-500 mb-1.5">{label}</div>
          {series.map((s, si) => {
            const val = s.values[i] ?? 0;
            return (
              <div key={s.name} className="mb-1">
                <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                  <span>{s.name}</span>
                  <span className="font-medium text-slate-700">{fmtValue(val, format)}</span>
                </div>
                <div className="h-3.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max((val / max) * 100, 1)}%`,
                      backgroundColor: PALETTE[si % PALETTE.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DonutChart({ title, data, format }: DonutChartData) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 40;
  const r = 22;
  const cx = 50;
  const cy = 50;

  let startAngle = -Math.PI / 2;
  const segments = data.map((d, i) => {
    const fraction = total > 0 ? d.value / total : 1 / data.length;
    const angle = fraction * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const large = angle > Math.PI ? 1 : 0;

    const cos1 = Math.cos(startAngle), sin1 = Math.sin(startAngle);
    const cos2 = Math.cos(endAngle), sin2 = Math.sin(endAngle);
    const path = [
      `M ${cx + R * cos1} ${cy + R * sin1}`,
      `A ${R} ${R} 0 ${large} 1 ${cx + R * cos2} ${cy + R * sin2}`,
      `L ${cx + r * cos2} ${cy + r * sin2}`,
      `A ${r} ${r} 0 ${large} 0 ${cx + r * cos1} ${cy + r * sin1}`,
      'Z',
    ].join(' ');

    startAngle = endAngle;
    return { path, color: PALETTE[i % PALETTE.length], label: d.label, value: d.value, fraction };
  });

  return (
    <div className="my-2 p-4 bg-slate-50 rounded-xl">
      {title && <div className="text-sm font-bold text-slate-700 mb-3">{title}</div>}
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
          {data.length === 1 ? (
            <>
              <circle cx={cx} cy={cy} r={R} fill={PALETTE[0]} />
              <circle cx={cx} cy={cy} r={r} fill="white" />
            </>
          ) : (
            segments.map((s, i) => <path key={i} d={s.path} fill={s.color} />)
          )}
        </svg>
        <div className="flex flex-col gap-2">
          {segments.map(s => (
            <div key={s.label} className="flex items-center gap-2 text-sm">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-slate-600">{s.label}</span>
              <span className="font-semibold text-slate-800">{fmtValue(s.value, format)}</span>
              <span className="text-slate-400 text-xs">({Math.round(s.fraction * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props {
  block: ChartBlockType;
}

export default function ChartBlock({ block }: Props) {
  const { data, raw } = block;

  if (!data) {
    return (
      <pre className="bg-slate-100 rounded-lg p-3 text-xs text-slate-500 overflow-x-auto my-2 whitespace-pre-wrap">
        {raw}
      </pre>
    );
  }

  if (data.type === 'bar') return <BarChart {...data} />;
  if (data.type === 'compare') return <CompareChart {...data} />;
  if (data.type === 'donut') return <DonutChart {...data} />;

  return null;
}
