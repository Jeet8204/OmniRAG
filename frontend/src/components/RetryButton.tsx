import React from 'react';
import { RetryIcon } from './icons/Icons';

const RetryButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
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

export default RetryButton;
