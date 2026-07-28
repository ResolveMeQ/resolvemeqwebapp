import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import CodeEntrySection from '../../components/auth/CodeEntrySection';
import AuthThemeToggle from '../../components/auth/AuthThemeToggle';
import BrandLogo from '../../components/brand/BrandLogo';
import { api } from '../../services/api';

/**
 * Verify page - user arrives with ?token=...&email=... from signup verification email
 */
const Verify = ({ onVerified, onNavigateToLogin }) => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [email, setEmail] = useState(emailFromUrl);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    setToken(tokenFromUrl);
    setEmail(emailFromUrl);
  }, [tokenFromUrl, emailFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim() || !email.trim()) {
      setError('Please enter both email and verification code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.auth.verifyUser({ token: token.trim(), email: email.trim() });
      setSuccess(true);
      onVerified?.();
    } catch (err) {
      setError(err?.message || 'Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email first');
      return;
    }
    setResending(true);
    setError('');
    setResendMessage('');
    try {
      await api.auth.resendVerificationCode(email.trim());
      setResendMessage('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen brand-auth-shell flex items-center justify-center p-4">
        <AuthThemeToggle />
        <div className="w-full max-w-md">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-sm border border-blue-900/5 dark:border-blue-400/10 p-8 text-center">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Account verified</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your email has been verified. You can now sign in to your account.
            </p>
            <Button variant="primary" className="w-full" onClick={onNavigateToLogin}>
              Sign in
              <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen brand-auth-shell flex items-center justify-center p-4">
      <AuthThemeToggle />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-6">
            <BrandLogo adaptive variant="lockup" className="h-10" markClassName="h-10 w-10" wordmarkClassName="text-2xl" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Verify your email</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Enter the verification code from your email</p>
        </div>

        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-sm border border-blue-900/5 dark:border-blue-400/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <CodeEntrySection
              email={email}
              onEmailChange={(v) => setEmail(v)}
              code={token}
              onCodeChange={(v) => setToken(v)}
              error={error}
              onErrorClear={() => setError('')}
              label="Verification code"
              codePlaceholder="6-digit code from email"
              showResend
              onResend={handleResend}
              resending={resending}
            />
            {resendMessage && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">{resendMessage}</p>
              </div>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify account'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="flex items-center justify-center w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
