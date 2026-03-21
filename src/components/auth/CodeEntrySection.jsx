import React from 'react';
import { Mail } from 'lucide-react';

/**
 * Reusable section for entering email + 6-digit code.
 * Used for email verification (signup) and password reset (when not using link).
 */
const CodeEntrySection = ({
  email,
  onEmailChange,
  code,
  onCodeChange,
  error,
  onErrorClear,
  label = 'Verification code',
  codePlaceholder = '6-digit code from email',
  showResend = false,
  onResend,
  resending = false,
  resendLabel = "Didn't receive the code? Resend",
}) => (
  <>
    <div>
      <label htmlFor="code-email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
        Email
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Mail className="h-4 w-4 text-gray-400" />
        </div>
        <input
          id="code-email"
          type="email"
          value={email}
          onChange={(e) => {
            onEmailChange(e.target.value);
            onErrorClear?.();
          }}
          className="input-enterprise pl-10"
          placeholder="you@company.com"
        />
      </div>
    </div>
    <div>
      <label htmlFor="code-input" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        id="code-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '');
          onCodeChange(v);
          onErrorClear?.();
        }}
        className="input-enterprise font-mono text-center text-lg tracking-widest"
        placeholder={codePlaceholder}
      />
    </div>
    {error && (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )}
    {showResend && onResend && (
      <button
        type="button"
        onClick={onResend}
        disabled={resending || !email.trim()}
        className="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50"
      >
        {resending ? 'Sending...' : resendLabel}
      </button>
    )}
  </>
);

export default CodeEntrySection;
