import React, { useEffect, useRef } from 'react';
import EmptyState from './EmptyState';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';
import type { Message, ChatMode } from '../hooks/useChat';

interface MessageListProps {
  messages: Message[];
  markdownComponents: any;
  retryLast: () => void;
  isLoading: boolean;
  onPromptClick: (prompt: string) => void;
  mode?: ChatMode;
  gmailToken?: string | null;
  gmailLogin?: () => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  markdownComponents,
  retryLast,
  isLoading,
  onPromptClick,
  mode,
  gmailToken,
  gmailLogin,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const lastMessage = messages[messages.length - 1];
  const showThinking = isLoading && lastMessage?.content === '';

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 md:px-8">
      {messages.length === 0 ? (
        <EmptyState
          onPromptClick={onPromptClick}
          mode={mode}
          gmailToken={gmailToken}
          gmailLogin={gmailLogin}
        />
      ) : (
        <div className="flex flex-col gap-5 max-w-4xl mx-auto">
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              msg={msg}
              markdownComponents={markdownComponents}
              retryLast={retryLast}
            />
          ))}

          {showThinking && <ThinkingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      )}
    </main>
  );
};

export default MessageList;