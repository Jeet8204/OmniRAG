import React, { useRef } from 'react';
import { PlusIcon, SendIcon, StopIcon, SpinnerIcon, CheckIcon, WarningIcon } from './icons/Icons';
import type { ChatMode } from '../hooks/useChat';

interface InputBarProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: (e: React.FormEvent) => void;
  isLoading: boolean;
  stopGeneration: () => void;
  uploadFile: (file: File) => void;
  isUploading: boolean;
  uploadStatus: string | null;
  mode?: ChatMode;
  gmailToken?: string | null;
  gmailLogin?: () => void;
}

const InputBar: React.FC<InputBarProps> = ({
  input,
  setInput,
  sendMessage,
  isLoading,
  stopGeneration,
  uploadFile,
  isUploading,
  uploadStatus,
  mode,
  gmailToken,
  gmailLogin,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) uploadFile(e.target.files[0]);
    e.target.value = '';
  };

  const isError = uploadStatus?.startsWith('Error');
  const isGmail = mode === 'gmail';
  const gmailConnected = isGmail && !!gmailToken;
  const canSend = input.trim() && (isGmail ? gmailConnected : true);

  const placeholder = isGmail
    ? gmailConnected
      ? 'Ask anything about your emails…'
      : 'Connect Gmail first…'
    : 'Ask anything about your document…';

  return (
    <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-white dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto">

        {/* Upload status chip — document mode only */}
        {uploadStatus && !isGmail && (
          <div className="mb-2 flex">
            <span
              className={`inline-flex items-center gap-2 text-xs pl-1.5 pr-3 py-1.5 rounded-xl border
                ${isError
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                }`}
            >
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center
                  ${isError ? 'bg-red-100 dark:bg-red-900/50' : 'bg-white dark:bg-neutral-700'}`}
              >
                {isUploading ? (
                  <SpinnerIcon className="w-3 h-3 animate-spin" />
                ) : isError ? (
                  <WarningIcon className="w-3 h-3" />
                ) : (
                  <CheckIcon className="w-3 h-3" />
                )}
              </span>
              {uploadStatus}
            </span>
          </div>
        )}

        <div
          className="flex items-end gap-1.5
            bg-neutral-100 dark:bg-neutral-800
            border border-neutral-200 dark:border-neutral-700
            focus-within:border-neutral-400 dark:focus-within:border-neutral-500
            rounded-2xl pl-2 pr-2 py-2 transition-colors duration-150"
        >
          {/* Upload button — document mode only */}
          {!isGmail && (
            <>
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
                title="Upload PDF"
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                  border border-neutral-300 dark:border-neutral-600
                  text-neutral-500 dark:text-neutral-400
                  hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors duration-150"
              >
                {isUploading
                  ? <SpinnerIcon className="w-4 h-4 animate-spin" />
                  : <PlusIcon className="w-4 h-4" />
                }
              </button>
            </>
          )}

          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && canSend && !isLoading) {
                sendMessage(e as unknown as React.FormEvent);
              }
            }}
            placeholder={placeholder}
            disabled={isUploading || (isGmail && !gmailConnected)}
            className="flex-1 text-sm bg-transparent border-none outline-none py-1.5
              text-neutral-900 dark:text-neutral-100
              placeholder:text-neutral-400 dark:placeholder:text-neutral-500
              disabled:opacity-50"
          />

          {/* ↵ hint */}
          {canSend && !isLoading && (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0 select-none pb-2">↵</span>
          )}

          {/* Connect Gmail shortcut inside input bar */}
          {isGmail && !gmailConnected && (
            <button
              onClick={gmailLogin}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg
                border border-neutral-200 dark:border-neutral-700
                text-neutral-500 dark:text-neutral-400
                hover:text-neutral-700 dark:hover:text-neutral-300
                hover:bg-neutral-200 dark:hover:bg-neutral-700
                transition-colors duration-150"
            >
              Connect
            </button>
          )}

          {/* Send / Stop */}
          <button
            onClick={isLoading ? stopGeneration : (e) => sendMessage(e as unknown as React.FormEvent)}
            disabled={!isLoading && !canSend}
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
              bg-neutral-900 dark:bg-neutral-100
              text-white dark:text-neutral-900
              hover:opacity-80 disabled:opacity-20 disabled:cursor-default
              transition-opacity duration-150"
          >
            {isLoading ? <StopIcon className="w-3.5 h-3.5" /> : <SendIcon className="w-4 h-4" />}
          </button>

        </div>
      </div>
    </div>
  );
};

export default InputBar;