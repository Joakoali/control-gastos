import { useRef } from 'react';

interface Props {
  disabled: boolean;
  onSend: (text: string) => void;
}

export default function ChatInput({ disabled, onSend }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const val = ref.current?.value.trim();
    if (!val || disabled) return;
    onSend(val);
    if (ref.current) ref.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-100 p-3 flex gap-2 items-end bg-white shrink-0">
      <textarea
        ref={ref}
        rows={1}
        disabled={disabled}
        placeholder="Preguntá sobre tus gastos..."
        onKeyDown={handleKeyDown}
        className="flex-1 resize-none border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 max-h-32 min-h-[44px] disabled:opacity-60"
      />
      <button
        onClick={handleSend}
        disabled={disabled}
        className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl w-11 h-11 flex items-center justify-center shrink-0 text-lg disabled:opacity-40 active:opacity-80"
      >
        ↑
      </button>
    </div>
  );
}
