import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useChat } from './hooks/useChat';

// ── Dark mode hook ───────────────────────────────────────────────────────────
const useIsDark = () => {
  const [isDark, setIsDark] = React.useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDark;
};

// ── Markdown components factory ──────────────────────────────────────────────
const makeMarkdownComponents = (isDark: boolean) => ({
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');

    if (!inline && match) {
      return (
        <SyntaxHighlighter
          style={isDark ? oneDark : oneLight}
          language={match[1]}
          PreTag="div"
          customStyle={{
            borderRadius: '10px',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            margin: '0.75rem 0',
            padding: '0.875rem 1rem',
            border: isDark ? '0.5px solid #262626' : '0.5px solid #e5e5e5',
            background: isDark ? '#171717' : '#f5f5f5',
          }}
          codeTagProps={{
            style: { fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }

    return (
      <code
        className={className}
        style={{
          fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
          fontSize: '0.8rem',
          padding: '1px 6px',
          borderRadius: '5px',
          background: isDark ? '#262626' : '#f5f5f5',
          border: isDark ? '0.5px solid #404040' : '0.5px solid #e5e5e5',
          color: isDark ? '#d4d4d4' : '#404040',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
});

// ── Shared SVG icons ─────────────────────────────────────────────────────────
const RetryIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// ── Retry button ─────────────────────────────────────────────────────────────
const RetryButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="mt-1 self-start flex items-center gap-1.5 text-xs
      text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300
      transition-colors duration-150"
  >
    <RetryIcon />
    Try again
  </button>
);

// ── Message content renderer ─────────────────────────────────────────────────
const MessageContent = ({
  msg,
  markdownComponents,
  retryLast,
}: {
  msg: { role: string; content: string; error?: boolean; sources?: { title: string; page: number | string }[] };
  markdownComponents: ReturnType<typeof makeMarkdownComponents>;
  retryLast: () => void;
}) => {
  if (msg.content === '__quota__') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="text-sm font-medium">Usage limit reached</span>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          You've hit the API quota for now. This resets automatically — try again in a little while.
        </p>
        <RetryButton onClick={retryLast} />
      </div>
    );
  }

  if (msg.content === '__error__') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Something went wrong</span>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Couldn't reach the backend. Check your connection and try again.
        </p>
        <RetryButton onClick={retryLast} />
      </div>
    );
  }

  return (
    <>
      <div className="markdown-body">
        <ReactMarkdown components={markdownComponents}>
          {msg.content}
        </ReactMarkdown>
      </div>

      {msg.error && <RetryButton onClick={retryLast} />}

      {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...new Set(msg.sources.map((s) => `${s.title} (Pg. ${s.page})`))]
            .map((source, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full
                  border border-neutral-200 dark:border-neutral-700
                  bg-neutral-100 dark:bg-neutral-800
                  text-neutral-500 dark:text-neutral-400"
              >
                <FileIcon />
                {source}
              </span>
            ))}
        </div>
      )}
    </>
  );
};

// ── App ──────────────────────────────────────────────────────────────────────
function App() {
  const {
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
  } = useChat();

  const isDark = useIsDark();
  const markdownComponents = React.useMemo(
    () => makeMarkdownComponents(isDark),
    [isDark]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) uploadFile(e.target.files[0]);
  };

  const starterPrompts = [
    'Summarize this document',
    'What are the key insights?',
    'Generate interview questions',
    'Explain this document simply',
    'Extract important points',
  ];

  const lastMessage = messages[messages.length - 1];
  const showThinking = isLoading && lastMessage?.content === '';

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">

        {/* Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M4 6h16M4 18h16" />
            </svg>
          </div>
          <span className="text-base font-medium tracking-tight">OmniRAG</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Upload status pill */}
          {uploadStatus && (
            <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
              uploadStatus.startsWith('Error')
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            }`}>
              {uploadStatus}
            </span>
          )}

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
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              border border-neutral-200 dark:border-neutral-700
              bg-white dark:bg-neutral-800
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-50 dark:hover:bg-neutral-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors duration-150"
          >
            {isUploading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 20" strokeLinecap="round" />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4" />
                </svg>
                Upload PDF
              </>
            )}
          </button>

        </div>
      </header>

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 md:px-8">

        {messages.length === 0 ? (

          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 max-w-xl mx-auto">
            <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
              What do you want to know?
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Upload a PDF and ask questions about your documents.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-sm px-4 py-1.5 rounded-full
                    border border-neutral-200 dark:border-neutral-700
                    bg-neutral-100 dark:bg-neutral-800
                    text-neutral-600 dark:text-neutral-400
                    hover:bg-neutral-200 dark:hover:bg-neutral-700
                    hover:text-neutral-900 dark:hover:text-neutral-100
                    transition-colors duration-150"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

        ) : (

          /* Conversation */
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >

                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex-shrink-0 mt-0.5
                  flex items-center justify-center text-xs font-medium select-none
                  ${msg.role === 'assistant'
                    ? 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500'
                    : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  }`}
                >
                  {msg.role === 'assistant' ? <SparkleIcon /> : <span className="text-[11px]">U</span>}
                </div>

                {/* Bubble */}
                <div className={`max-w-[72%] text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-4 py-2.5 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <MessageContent
                    msg={msg}
                    markdownComponents={markdownComponents}
                    retryLast={retryLast}
                  />
                </div>

              </div>
            ))}

            {/* Thinking indicator */}
            {showThinking && (
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5
                  flex items-center justify-center
                  bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500"
                >
                  <SparkleIcon />
                </div>
                <div className="flex items-center gap-1 pt-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

        )}
      </main>

      {/* ── Input bar ── */}
      <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-white dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto flex items-center gap-2
          bg-neutral-100 dark:bg-neutral-800
          border border-neutral-200 dark:border-neutral-700
          focus-within:border-neutral-400 dark:focus-within:border-neutral-500
          rounded-xl px-4 py-2 transition-colors duration-150"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && input.trim() && !isLoading) {
                sendMessage(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Ask anything about your document…"
            disabled={isUploading}
            className="flex-1 text-sm bg-transparent border-none outline-none
              text-neutral-900 dark:text-neutral-100
              placeholder:text-neutral-400 dark:placeholder:text-neutral-500
              disabled:opacity-50"
          />

          {/* ↵ hint */}
          {input.trim() && !isLoading && (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0 select-none">↵</span>
          )}

          {/* Send / Stop */}
          <button
            onClick={isLoading
              ? stopGeneration
              : (e) => sendMessage(e as unknown as React.FormEvent)
            }
            disabled={!isLoading && !input.trim()}
            className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center
              bg-neutral-900 dark:bg-neutral-100
              text-white dark:text-neutral-900
              hover:opacity-80 disabled:opacity-20 disabled:cursor-default
              transition-opacity duration-150"
          >
            {isLoading ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
              </svg>
            )}
          </button>

        </div>
      </div>

    </div>
  );
}

export default App;