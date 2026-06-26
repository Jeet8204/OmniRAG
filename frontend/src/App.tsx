import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import MessageList from './components/MessageList';
import InputBar from './components/InputBar';
import { useIsDark } from './hooks/useIsDark';
import { makeMarkdownComponents } from './utils/markdownComponents';
import { useChat } from './hooks/useChat';
import type { ChatMode } from './hooks/useChat';
import { useAuth } from './useAuth';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import AuthPage from './AuthPage';

export default function App() {
  const { user, token, loading } = useAuth();

  if (loading) return <SplashScreen />;
  if (!user || !token) return <AuthPage />;

  return <ChatApp />;
}

function ChatApp() {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    stopGeneration,
    retryLast,
    uploadFile,
    isUploading,
    uploadStatus,
  } = useChat();

  const { gmailToken, login: gmailLogin, logout: gmailLogout } = useGoogleAuth();
  const [mode, setMode] = useState<ChatMode>('document');

  const isDark = useIsDark();
  const markdownComponents = React.useMemo(() => makeMarkdownComponents(isDark), [isDark]);

  // Wrap sendMessage to inject mode + gmailToken
  const handleSend = (e: React.FormEvent) => {
    sendMessage(e, mode, gmailToken ?? undefined);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 overflow-hidden">
      <Header
        mode={mode}
        setMode={setMode}
        gmailToken={gmailToken}
        gmailLogin={gmailLogin}
        gmailLogout={gmailLogout}
      />
      <MessageList
        messages={messages}
        markdownComponents={markdownComponents}
        retryLast={retryLast}
        isLoading={isLoading}
        onPromptClick={setInput}
        mode={mode}
        gmailToken={gmailToken}
        gmailLogin={gmailLogin}
      />
      <InputBar
        input={input}
        setInput={setInput}
        sendMessage={handleSend}
        isLoading={isLoading}
        stopGeneration={stopGeneration}
        uploadFile={uploadFile}
        isUploading={isUploading}
        uploadStatus={uploadStatus}
        mode={mode}
        gmailToken={gmailToken}
        gmailLogin={gmailLogin}
      />
    </div>
  );
}

function SplashScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '2px solid #374151',
        borderTopColor: '#E5E7EB',
        borderRadius: '50%',
        animation: 'ka-spin 0.75s linear infinite',
      }} />
      <style>{`@keyframes ka-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}