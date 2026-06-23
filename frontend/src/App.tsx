import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from './hooks/useChat';

function App() {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    uploadFile,
    isUploading,
    uploadStatus,
  } = useChat();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const starterPrompts = [
    'Summarize this document',
    'What are the key insights?',
    'Generate interview questions',
    'Explain this document simply',
    'Extract important points',
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-50 overflow-hidden">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            ✨ Knowledge Assistant
          </h1>
          <p className="text-sm text-slate-400">
            Powered by RAG + Gemini
          </p>
        </div>

        <div>
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white font-semibold hover:scale-[1.02] transition-all disabled:opacity-60"
          >
            {isUploading
              ? '⏳ Processing...'
              : '📄 Upload PDF'}
          </button>
        </div>
      </header>

      {/* Upload Status */}
      {uploadStatus && (
        <div
          className={`px-4 py-3 text-center text-sm font-medium ${
            uploadStatus.startsWith('Error')
              ? 'bg-red-500/10 text-red-300 border-b border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-300 border-b border-emerald-500/20'
          }`}
        >
          {uploadStatus}
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto mt-20 text-center">
            <h2 className="text-4xl font-bold mb-4">
              🚀 Start a Conversation
            </h2>

            <p className="text-slate-400 text-lg mb-8">
              Upload a PDF and ask questions about your
              documents.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-indigo-500/20 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  msg.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-5 py-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
                      : 'bg-white/5 border border-white/10 backdrop-blur-md'
                  }`}
                >
                  <div className="markdown-body">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {msg.role === 'assistant' &&
                    msg.sources &&
                    msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                        {Array.from(
                          new Set(
                            msg.sources.map(
                              (s) =>
                                `${s.title} (Pg. ${s.page})`
                            )
                          )
                        ).map((source, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-200"
                          >
                            📚 {source}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="mt-6 flex">
            <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your document..."
          disabled={isLoading}
          className="flex-1 px-5 py-3 rounded-xl bg-slate-950 border border-white/10 outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold disabled:opacity-50"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default App;