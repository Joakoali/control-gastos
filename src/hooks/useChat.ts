import { useState } from 'react';
import { auth } from '../firebase';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ERROR_MAP: Record<string, string> = {
  no_token: 'Iniciá sesión de nuevo',
  invalid_token: 'Iniciá sesión de nuevo',
  no_access: 'No tenés acceso a esta función',
  no_household: 'Configurá tu hogar primero',
  too_many_messages: 'La conversación es muy larga, refrescá el chat',
  message_too_long: 'El mensaje es muy largo',
  model_error: 'Error del modelo, probá de nuevo',
};

function mapError(code: string): string {
  return ERROR_MAP[code] ?? 'Sin conexión, revisá tu internet';
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(content: string) {
    if (!content.trim() || streaming) return;
    setError(null);

    const userMsg: Message = { role: 'user', content };
    const assistantMsg: Message = { role: 'assistant', content: '' };
    const history = [...messages, userMsg];
    setMessages([...history, assistantMsg]);
    setStreaming(true);

    let idToken: string;
    try {
      idToken = await auth.currentUser!.getIdToken();
    } catch {
      setError(mapError('no_token'));
      setStreaming(false);
      setMessages(prev => prev.slice(0, -1));
      return;
    }

    let res: Response;
    try {
      res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: history }),
      });
    } catch {
      setError(mapError('network'));
      setStreaming(false);
      setMessages(prev => prev.slice(0, -1));
      return;
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: 'unknown' }));
      setError(mapError((errBody as { error?: string }).error ?? 'unknown'));
      setStreaming(false);
      setMessages(prev => prev.slice(0, -1));
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break outer;

          try {
            const json = JSON.parse(data) as { delta?: string; error?: string };
            if (json.delta) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, content: last.content + json.delta };
                return updated;
              });
            }
            if (json.error) setError(mapError(json.error));
          } catch { /* ignore malformed */ }
        }
      }
    } catch {
      setError(mapError('model_error'));
    } finally {
      setStreaming(false);
    }
  }

  function clear() {
    setMessages([]);
    setError(null);
  }

  return { messages, streaming, error, send, clear };
}
