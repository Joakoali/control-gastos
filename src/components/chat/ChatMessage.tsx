import ReactMarkdown from 'react-markdown';
import { parseChat } from '../../utils/parseChat';
import ChartBlock from './ChartBlock';
import type { Message } from '../../hooks/useChat';

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="bg-violet-100 text-violet-900 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  const isEmpty = !message.content;
  const blocks = isEmpty ? [] : parseChat(message.content);

  return (
    <div className="flex gap-2.5 mb-4">
      <div className="text-base shrink-0 mt-0.5">🤖</div>
      <div className="flex-1 min-w-0">
        {isEmpty && isStreaming ? (
          <span className="text-slate-400 text-sm animate-pulse">...</span>
        ) : (
          blocks.map((block, i) =>
            block.type === 'chart' ? (
              <ChartBlock key={i} block={block} />
            ) : (
              <div key={i} className="text-sm text-slate-800 leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0 [&_strong]:font-semibold">
                <ReactMarkdown>{block.content}</ReactMarkdown>
              </div>
            )
          )
        )}
        {isStreaming && message.content && (
          <span className="inline-block w-0.5 h-3.5 bg-violet-500 animate-pulse ml-0.5 align-middle rounded-full" />
        )}
      </div>
    </div>
  );
}
