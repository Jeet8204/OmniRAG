import { useState, useCallback } from 'react';

// Explicitly type the source object instead of using loose 'any' signatures
export interface SourceMaterial {
  source_type: string;
  title: string;
  page: number | string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceMaterial[];
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadStatus("Uploading and indexing document...");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to upload file");
      }

      setUploadStatus(`Success: ${file.name} indexed permanently!`);
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const errMsg = error instanceof Error ? error.message : "An unknown transmission error occurred";
      setUploadStatus(`Error: ${errMsg}`);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    
    // Functional state transition prevents synchronization race conditions
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.body) throw new Error('No response body returned from network endpoint');

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      // Initialize target message shell cleanly
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let bufferStr = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        // Passing true stream state flags handles broken multi-byte character strings accurately
        bufferStr += decoder.decode(value, { stream: true });
        const lines = bufferStr.split('\n');
        
        // Preserve the last line fragment in the buffer memory loop
        bufferStr = lines.pop() || '';
        
        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            const dataStr = cleanLine.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(dataStr);
              
              if (parsed.type === 'sources') {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMessage = { ...updated[updated.length - 1] };
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.sources = parsed.data as SourceMaterial[];
                    updated[updated.length - 1] = lastMessage;
                  }
                  return updated;
                });
              } else if (parsed.type === 'token') {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMessage = { ...updated[updated.length - 1] };
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content += parsed.data;
                    updated[updated.length - 1] = lastMessage;
                  }
                  return updated;
                });
              }
            } catch {
              // Gracefully continue through fragmented token sets
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('Error streaming chat application:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please check your backend database connection.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return { messages, input, setInput, sendMessage, isLoading, uploadFile, isUploading, uploadStatus };
};