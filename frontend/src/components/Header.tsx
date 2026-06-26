import React from 'react';
import type { ChatMode } from '../hooks/useChat';

interface HeaderProps {
  mode: ChatMode;
  setMode: (m: ChatMode) => void;
  gmailToken: string | null;
  gmailLogin: () => void;
  gmailLogout: () => void;
}

const GoogleIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  gmailToken,
  gmailLogin,
  gmailLogout,
}) => (
  <header className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">

    {/* Wordmark */}
    <div className="flex items-center gap-2.5 justify-self-start">
      <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M4 6h16M4 18h16" />
        </svg>
      </div>
      <span className="text-base font-medium tracking-tight">OmniRAG</span>
    </div>

    {/* Mode toggle — now in its own grid column, truly fixed/centered */}
    <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 justify-self-center">
      {(['document', 'gmail'] as ChatMode[]).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150
            ${mode === m
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
        >
          {m === 'document' ? (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Docs
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Gmail
            </>
          )}
        </button>
      ))}
    </div>

    {/* Right — Gmail connect / disconnect */}
    <div className="flex items-center gap-3 justify-self-end">
      {mode === 'gmail' && (
        gmailToken ? (
          <button
            onClick={gmailLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              border border-neutral-200 dark:border-neutral-700
              bg-white dark:bg-neutral-800
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-50 dark:hover:bg-neutral-700
              transition-colors duration-150"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Gmail connected
          </button>
        ) : (
          <button
            onClick={gmailLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              border border-neutral-200 dark:border-neutral-700
              bg-white dark:bg-neutral-800
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-50 dark:hover:bg-neutral-700
              transition-colors duration-150"
          >
            <GoogleIcon />
            Connect Gmail
          </button>
        )
      )}
    </div>

  </header>
);

export default Header;