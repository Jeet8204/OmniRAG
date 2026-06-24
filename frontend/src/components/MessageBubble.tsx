import React from 'react';
import { SparkleIcon } from './icons/Icons';
import MessageContent from './MessageContent';
import type { Message } from '../hooks/useChat';

interface MessageBubbleProps {
  msg: Message;
  markdownComponents: any;
  retryLast: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, markdownComponents, retryLast }) => (
  <div className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
      <MessageContent msg={msg} markdownComponents={markdownComponents} retryLast={retryLast} />
    </div>
  </div>
);

export default MessageBubble;
