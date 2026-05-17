import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import type { Message } from '../../hooks/useChat';

interface Props {
  messages: Message[];
  streaming: boolean;
}

export default function ChatMessageList({ messages, streaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map((msg, i) => (
        <ChatMessage
          key={i}
          message={msg}
          isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
