import { useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import EmptyState from './EmptyState';

interface Props {
  onClose: () => void;
}

export default function ChatModal({ onClose }: Props) {
  const { messages, streaming, error, send, clear } = useChat();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:items-center md:justify-center md:bg-black/40">
      <div className="flex flex-col h-full w-full md:h-[85vh] md:max-w-2xl md:rounded-2xl md:overflow-hidden md:shadow-2xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="font-bold text-slate-800">Asistente</span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && !streaming && (
              <button
                onClick={clear}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 text-sm text-red-600 shrink-0">
            {error}
          </div>
        )}

        {/* Content */}
        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto">
            <EmptyState onSelect={send} />
          </div>
        ) : (
          <ChatMessageList messages={messages} streaming={streaming} />
        )}

        {/* Input */}
        <ChatInput disabled={streaming} onSend={send} />
      </div>
    </div>
  );
}
