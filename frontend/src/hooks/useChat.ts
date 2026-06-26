import { useState, useCallback, useRef } from 'react';
import { useAuth, authHeaders } from '../useAuth';

export type ChatMode = 'document' | 'gmail';

export interface SourceMaterial {
  source_type: string;
  title: string;
  page: number | string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceMaterial[];
  error?: boolean;
}

export const useChat = () => {
  const { token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false); // guards against duplicate in-flight requests

  // ── Stop generation ──────────────────────────────────────────────
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // ── Upload ───────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadStatus('Uploading and indexing document…');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        headers: { ...authHeaders(token) },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to upload file');
      }

      setUploadStatus(`✓ ${file.name} indexed`);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown upload error';
      setUploadStatus(`Error: ${errMsg}`);
    } finally {
      setIsUploading(false);
      if (uploadStatusTimerRef.current) clearTimeout(uploadStatusTimerRef.current);
      uploadStatusTimerRef.current = setTimeout(() => setUploadStatus(null), 4000);
    }
  }, [token]);

  // ── Retry ────────────────────────────────────────────────────────
  const retryLast = useCallback(() => {
    setMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].error) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    setMessages((prev) => {
      const lastUser = [...prev].reverse().find((m) => m.role === 'user');
      if (lastUser) setInput(lastUser.content);
      return prev;
    });
  }, []);

  // ── Send ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (e: React.FormEvent, mode: ChatMode = 'document', gmailToken?: string) => {
      e.preventDefault();
      if (!input.trim() || isLoading || isFetchingRef.current) return;

      isFetchingRef.current = true; // lock

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMessage: Message = { role: 'user', content: input };
      setMessages((prev) => [...prev, userMessage]);
      const currentInput = input;
      setInput('');
      setIsLoading(true);

      try {
        const endpoint = mode === 'gmail'
          ? 'http://localhost:8000/api/gmail-chat'
          : 'http://localhost:8000/api/chat';

        const body = mode === 'gmail'
          ? JSON.stringify({ message: currentInput, access_token: gmailToken })
          : JSON.stringify({ message: currentInput });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(token),
          },
          body,
          signal: controller.signal,
        });

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const clean = line.trim();
            if (!clean.startsWith('data: ')) continue;

            const dataStr = clean.slice(6).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.type === 'sources') {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = { ...updated[updated.length - 1] };
                  if (last.role === 'assistant') {
                    last.sources = parsed.data as SourceMaterial[];
                    updated[updated.length - 1] = last;
                  }
                  return updated;
                });
              } else if (parsed.type === 'token') {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = { ...updated[updated.length - 1] };
                  if (last.role === 'assistant') {
                    last.content += parsed.data;
                    updated[updated.length - 1] = last;
                  }
                  return updated;
                });
              }
            } catch {
              // Swallow malformed JSON fragments
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;

        console.error('Chat stream error:', error);

        const isQuota = error instanceof Error && (
          error.message.includes('quota') ||
          error.message.includes('429') ||
          error.message.includes('interrupted')
        );

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: isQuota ? '__quota__' : '__error__',
            error: true,
          },
        ]);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        isFetchingRef.current = false; // unlock
      }
    },
    [input, isLoading, token]
  );

  return {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    stopGeneration,
    retryLast,
    uploadFile,
    isUploading,
    uploadStatus,
  };
};