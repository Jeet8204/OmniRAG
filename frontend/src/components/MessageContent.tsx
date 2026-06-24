import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ErrorIcon, WarningIcon, FileIcon } from './icons/Icons';
import RetryButton from './RetryButton';
import type { Message } from '../hooks/useChat';

interface MessageContentProps {
  msg: Message;
  markdownComponents: any;
  retryLast: () => void;
}

const MessageContent: React.FC<MessageContentProps> = ({ msg, markdownComponents, retryLast }) => {
  if (msg.content === '__quota__') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <WarningIcon className="w-4 h-4 shrink-0" />
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
          <ErrorIcon className="w-4 h-4 shrink-0" />
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

export default MessageContent;
