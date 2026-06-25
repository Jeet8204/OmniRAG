import { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import type { AuthError } from "firebase/auth";
import { auth } from "./firebase";  
type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [loading, setLoading]     = useState(false);

  const clearMessages = () => { setError(""); setSuccess(""); };

  const switchMode = (next: Mode) => {
    setMode(next);
    clearMessages();
  };

  const handleGoogle = async () => {
    setLoading(true);
    clearMessages();
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      setError(friendlyError(e as AuthError));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email.trim())      return setError("Please enter your email address.");
    if (!email.includes("@")) return setError("Please enter a valid email.");
    if (!password)          return setError("Please enter your password.");
    if (mode === "signup" && password.length < 6)
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    clearMessages();
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = [firstName, lastName].filter(Boolean).join(" ");
        if (displayName) await updateProfile(cred.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(friendlyError(e as AuthError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ka-root">
      <div className="ka-card">

        {/* Logo */}
        <div className="ka-logo">
          <div className="ka-logo-inner">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 3.5C11 3.5 5 8 5 13a6 6 0 0012 0c0-5-6-9.5-6-9.5z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"
              />
              <path d="M11 13v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h1 className="ka-title">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="ka-subtitle">
          {mode === "signin"
            ? "Sign in to your Knowledge Assistant"
            : "Get started with Knowledge Assistant"}
        </p>

        {/* Google */}
        <button className="ka-btn-google" onClick={handleGoogle} disabled={loading} type="button">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="ka-divider">
          <span className="ka-divider-line" />
          <span className="ka-divider-text">or</span>
          <span className="ka-divider-line" />
        </div>

        {/* Fields */}
        <div className="ka-fields">
          {mode === "signup" && (
            <div className="ka-name-row">
              <Field icon="ti-user" type="text" placeholder="First name"
                value={firstName} onChange={setFirstName} onFocus={clearMessages} />
              <Field icon="ti-user" type="text" placeholder="Last name"
                value={lastName} onChange={setLastName} onFocus={clearMessages} />
            </div>
          )}
          <Field icon="ti-mail" type="email" placeholder="Email address"
            value={email} onChange={setEmail} onFocus={clearMessages} />
          <Field icon="ti-lock" type="password"
            placeholder={mode === "signup" ? "Password (min. 6 characters)" : "Password"}
            value={password} onChange={setPassword} onFocus={clearMessages}
            onEnter={handleSubmit} />
        </div>

        {/* Feedback */}
        {error   && <p className="ka-feedback ka-error">{error}</p>}
        {success && <p className="ka-feedback ka-success">{success}</p>}
        {!error && !success && <div className="ka-feedback-placeholder" />}

        {/* Terms for signup */}
        {mode === "signup" && (
          <p className="ka-terms">
            By creating an account you agree to our{" "}
            <a href="#" className="ka-link">Terms</a> and{" "}
            <a href="#" className="ka-link">Privacy Policy</a>.
          </p>
        )}

        <button className="ka-btn-primary" onClick={handleSubmit} disabled={loading} type="button">
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <p className="ka-toggle">
          {mode === "signin" ? (
            <>Don't have an account?{" "}
              <button className="ka-link" onClick={() => switchMode("signup")} type="button">Sign up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button className="ka-link" onClick={() => switchMode("signin")} type="button">Sign in</button>
            </>
          )}
        </p>
      </div>

      <style>{`
        .ka-root {
          min-height: 100vh;
          background: var(--color-background-tertiary, #f5f5f3);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        }
        .ka-card {
          background: var(--color-background-primary, #fff);
          border: 0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12));
          border-radius: 16px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 370px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ka-logo { margin-bottom: 1.5rem; }
        .ka-logo-inner {
          width: 44px; height: 44px;
          background: var(--color-background-secondary, #f5f5f3);
          border: 0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12));
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--color-text-primary, #000);
        }
        .ka-title {
          font-size: 20px; font-weight: 500;
          color: var(--color-text-primary, #000);
          margin-bottom: 4px; text-align: center;
        }
        .ka-subtitle {
          font-size: 13px; color: var(--color-text-secondary, #6b7280);
          margin-bottom: 1.75rem; text-align: center; line-height: 1.5;
        }
        .ka-btn-google {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 9px; padding: 9px 14px;
          background: var(--color-background-primary, #fff);
          border: 0.5px solid var(--color-border-secondary, rgba(0,0,0,0.22));
          border-radius: 8px;
          color: var(--color-text-primary, #000);
          font-size: 14px; font-weight: 500; cursor: pointer;
          transition: background 0.12s; margin-bottom: 1.25rem;
        }
        .ka-btn-google:hover:not(:disabled) { background: var(--color-background-secondary, #f5f5f3); }
        .ka-btn-google:disabled { opacity: 0.45; cursor: not-allowed; }
        .ka-divider {
          width: 100%; display: flex; align-items: center;
          gap: 10px; margin-bottom: 1.25rem;
        }
        .ka-divider-line { flex: 1; height: 0.5px; background: var(--color-border-tertiary, rgba(0,0,0,0.1)); }
        .ka-divider-text { font-size: 12px; color: var(--color-text-tertiary, #aaa); }
        .ka-fields { width: 100%; display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
        .ka-name-row { display: flex; gap: 8px; }
        .ka-name-row > * { flex: 1; min-width: 0; }
        .ka-field-wrap { position: relative; width: 100%; }
        .ka-field-icon {
          position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
          color: var(--color-text-tertiary, #aaa); font-size: 15px; pointer-events: none;
        }
        .ka-inp {
          width: 100%; padding: 9px 12px 9px 34px;
          background: var(--color-background-secondary, #f5f5f3);
          border: 0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12));
          border-radius: 8px;
          color: var(--color-text-primary, #000);
          font-size: 14px; outline: none;
          transition: border-color 0.12s;
          font-family: inherit;
        }
        .ka-inp:focus { border-color: var(--color-border-primary, rgba(0,0,0,0.4)); }
        .ka-inp::placeholder { color: var(--color-text-tertiary, #aaa); }
        .ka-feedback { width: 100%; font-size: 12px; margin: 6px 0; line-height: 1.4; }
        .ka-feedback-placeholder { height: 22px; }
        .ka-error   { color: var(--color-text-danger,  #a32d2d); }
        .ka-success { color: var(--color-text-success, #3b6d11); }
        .ka-terms {
          font-size: 11px; color: var(--color-text-tertiary, #aaa);
          text-align: center; line-height: 1.5; margin-bottom: 1rem; width: 100%;
        }
        .ka-btn-primary {
          width: 100%; padding: 9px 14px;
          background: var(--color-text-primary, #000);
          border: none; border-radius: 8px;
          color: var(--color-background-primary, #fff);
          font-size: 14px; font-weight: 500; cursor: pointer;
          transition: opacity 0.12s; margin-bottom: 1.25rem;
          font-family: inherit;
        }
        .ka-btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .ka-btn-primary:active:not(:disabled) { opacity: 0.7; }
        .ka-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .ka-toggle {
          font-size: 12.5px; color: var(--color-text-secondary, #6b7280); text-align: center;
        }
        .ka-link {
          background: none; border: none; padding: 0;
          color: var(--color-text-primary, #000);
          font-size: inherit; cursor: pointer;
          text-decoration: underline; text-underline-offset: 2px;
          font-family: inherit;
        }
        .ka-link:hover { opacity: 0.65; }
      `}</style>
    </div>
  );
}

function Field({
  icon, type, placeholder, value, onChange, onFocus, onEnter,
}: {
  icon: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  onFocus?: () => void; onEnter?: () => void;
}) {
  return (
    <div className="ka-field-wrap">
      <i className={`ti ${icon} ka-field-icon`} aria-hidden="true" />
      <input
        className="ka-inp"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        autoComplete={type === "email" ? "email" : type === "password" ? "current-password" : "off"}
      />
    </div>
  );
}

function friendlyError(e: AuthError): string {
  const map: Record<string, string> = {
    "auth/user-not-found":        "No account found with this email.",
    "auth/wrong-password":        "Incorrect password.",
    "auth/email-already-in-use":  "An account with this email already exists.",
    "auth/weak-password":         "Password must be at least 6 characters.",
    "auth/invalid-email":         "Please enter a valid email address.",
    "auth/popup-closed-by-user":  "Sign-in cancelled.",
    "auth/too-many-requests":     "Too many attempts. Please try again later.",
    "auth/invalid-credential":    "Incorrect email or password.",
    "auth/network-request-failed":"Network error. Check your connection.",
  };
  return map[e.code] ?? "Something went wrong. Please try again.";
}