import React from 'react';
import { SparkleIcon } from './icons/Icons';

const ThinkingIndicator: React.FC = () => (
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
);

export default ThinkingIndicator;
