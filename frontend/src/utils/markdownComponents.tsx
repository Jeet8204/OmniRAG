import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export const makeMarkdownComponents = (isDark: boolean) => ({
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');

    if (!inline && match) {
      return (
        <SyntaxHighlighter
          style={isDark ? oneDark : oneLight}
          language={match[1]}
          PreTag="div"
          customStyle={{
            borderRadius: '10px',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            margin: '0.75rem 0',
            padding: '0.875rem 1rem',
            border: isDark ? '0.5px solid #262626' : '0.5px solid #e5e5e5',
            background: isDark ? '#171717' : '#f5f5f5',
          }}
          codeTagProps={{
            style: { fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }

    return (
      <code
        className={className}
        style={{
          fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
          fontSize: '0.8rem',
          padding: '1px 6px',
          borderRadius: '5px',
          background: isDark ? '#262626' : '#f5f5f5',
          border: isDark ? '0.5px solid #404040' : '0.5px solid #e5e5e5',
          color: isDark ? '#d4d4d4' : '#404040',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
});
