import React from 'react';

const Header: React.FC = () => (
  <header className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M4 6h16M4 18h16" />
        </svg>
      </div>
      <span className="text-base font-medium tracking-tight">OmniRAG</span>
    </div>
  </header>
);

export default Header;
