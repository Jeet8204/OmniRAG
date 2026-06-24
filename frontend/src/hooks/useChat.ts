import { useState, useCallback, useRef } from 'react';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Abort controller ref — persists across renders without causing re-renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to upload file');
      }

      setUploadStatus(`✓ ${file.name} indexed`);
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Unknown upload error';
      setUploadStatus(`Error: ${errMsg}`);
    } finally {
      setIsUploading(false);

      // Clear status after 4 s — cancel any previous pending clear first
      if (uploadStatusTimerRef.current) clearTimeout(uploadStatusTimerRef.current);
      uploadStatusTimerRef.current = setTimeout(() => setUploadStatus(null), 4000);
    }
  }, []);

  // ── Retry ────────────────────────────────────────────────────────
  const retryLast = useCallback(() => {
    setMessages((prev) => {
      // Drop trailing error message, re-expose the last user turn
      const withoutError = prev.filter((_, i) => {
        if (i === prev.length - 1 && prev[i].error) return false;
        return true;
      });
      return withoutError;
    });
    // Re-populate input with the last user message so sendMessage can pick it up
    setMessages((prev) => {
      const lastUser = [...prev].reverse().find((m) => m.role === 'user');
      if (lastUser) setInput(lastUser.content);
      return prev;
    });
  }, []);

  // ── Send ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      // Fresh abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMessage: Message = { role: 'user', content: input };
      setMessages((prev) => [...prev, userMessage]);
      const currentInput = input;
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: currentInput }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        // Seed the assistant shell
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

        const isQuota = error instanceof Error &&
          (error.message.includes('quota') ||
          error.message.includes('429') ||
          error.message.includes('interrupted'));

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
      }
    },
    [input, isLoading]
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
