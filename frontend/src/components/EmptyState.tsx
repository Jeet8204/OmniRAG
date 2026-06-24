import React from 'react';

interface EmptyStateProps {
  onPromptClick: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  'Summarize this document',
  'What are the key insights?',
  'Generate interview questions',
  'Explain this document simply',
  'Extract important points',
];

const EmptyState: React.FC<EmptyStateProps> = ({ onPromptClick }) => (
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

export default EmptyState;
