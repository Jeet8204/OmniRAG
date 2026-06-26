import React from 'react';
import type { ChatMode } from '../hooks/useChat';

interface EmptyStateProps {
  onPromptClick: (prompt: string) => void;
  mode?: ChatMode;
  gmailToken?: string | null;
  gmailLogin?: () => void;
}

const STARTER_PROMPTS = [
  'Summarize this document',
  'What are the key insights?',
  'Generate interview questions',
  'Explain this document simply',
  'Extract important points',
];

const GMAIL_PROMPTS = [
  'Summarize my last 5 emails',
  'Any unread emails from today?',
  'Do I have any invoices?',
  'What did my team send this week?',
];

const GoogleIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const EmptyState: React.FC<EmptyStateProps> = ({
  onPromptClick,
  mode,
  gmailToken,
  gmailLogin,
}) => {

  // ── Gmail mode, not connected ────────────────────────────────────
  if (mode === 'gmail' && !gmailToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 max-w-xl mx-auto">
        <div className="w-10 h-10 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
          Connect your Gmail
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Ask questions across your emails — summaries, search, follow-ups.
        </p>
        <button
          onClick={gmailLogin}
          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            border border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-800
            text-neutral-700 dark:text-neutral-300
            hover:bg-neutral-50 dark:hover:bg-neutral-700
            transition-colors duration-150"
        >
          <GoogleIcon />
          Connect Gmail
        </button>
      </div>
    );
  }

  // ── Gmail mode, connected ────────────────────────────────────────
  if (mode === 'gmail' && gmailToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-2 max-w-xl mx-auto">
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
          Ask about your emails
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          Gmail is connected. Try one of these:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {GMAIL_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onPromptClick(prompt)}
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
    );
  }

  // ── Document mode (default) ──────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-2 max-w-xl mx-auto">
      <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
        What do you want to know?
      </h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
        Upload a PDF and ask questions about your documents.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
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
  );
};

export default EmptyState;