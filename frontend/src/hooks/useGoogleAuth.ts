import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

export const useGoogleAuth = () => {
  const [gmailToken, setGmailToken] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: (res) => setGmailToken(res.access_token),
    onError: () => console.error('Google login failed'),
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
  });

  const logout = () => setGmailToken(null);

  return { gmailToken, login, logout };
};