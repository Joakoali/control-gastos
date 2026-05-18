interface Props {
  onSelect: (text: string) => void;
}

const SUGGESTIONS = [
  { emoji: '📊', text: 'Comparame los últimos 3 meses' },
  { emoji: '💸', text: '¿En qué gasté más este mes?' },
  { emoji: '📈', text: '¿Mi tendencia de ahorro va bien?' },
  { emoji: '🎯', text: '¿Dónde podría recortar?' },
];

export default function EmptyState({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 gap-4">
      <div className="text-slate-600 font-semibold text-base">👋 ¿Qué querés analizar?</div>
      <div className="flex flex-col gap-2.5 w-full max-w-sm">
        {SUGGESTIONS.map(({ emoji, text }) => (
          <button
            key={text}
            onClick={() => onSelect(text)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 text-left hover:bg-violet-50 hover:border-violet-200 active:bg-violet-100 transition-colors"
          >
            {emoji} {text}
          </button>
        ))}
      </div>
    </div>
  );
}
