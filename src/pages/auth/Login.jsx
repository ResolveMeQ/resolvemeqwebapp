import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import AuthThemeToggle from '../../components/auth/AuthThemeToggle';
import BrandLogo from '../../components/brand/BrandLogo';
import { isGoogleAuthEnabled } from '../../utils/googleAuth';
import { api, TokenService } from '../../services/api';

const isUnverifiedError = (msg) =>
  msg && (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('verify your email'));

/**
 * Login page with enterprise design
 */
const Login = ({ onLogin, onNavigateToSignup, onNavigateToForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showCodeEntry = needsVerification || resendSuccess || (errors.general && isUnverifiedError(errors.general));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (showCodeEntry && !verificationCode.trim()) {
      setErrors((prev) => ({ ...prev, general: 'Please enter the 6-digit verification code from your email.' }));
      return;
    }
    
    const needsVerify = showCodeEntry && verificationCode.trim();
    
    setLoading(true);
    setErrors({});
    
    try {
      if (needsVerify) {
        await api.auth.verifyUser({ token: verificationCode.trim(), email: formData.email });
      }
      const response = await api.auth.login(formData.email, formData.password);
      const user = await api.auth.getCurrentUser();
      TokenService.setUser(user);
      onLogin({ ...formData, user });
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: error.message || 'Login failed. Please check your credentials.' });
      setResendSuccess(false);
      if (error?.message && isUnverifiedError(error.message)) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;
    setResendLoading(true);
    setResendSuccess(false);
    setErrors((prev) => (prev.general ? { ...prev, general: '' } : prev));
    setNeedsVerification(true);
    try {
      await api.auth.resendVerificationCode(formData.email);
      setResendSuccess(true);
    } catch (err) {
      setErrors({ general: err?.message || 'Failed to resend. Please try again.' });
    } finally {
      setResendLoading(false);
    }
  };

  const showResendOption = errors.general && isUnverifiedError(errors.general);

  return (
    <div className="min-h-screen brand-auth-shell flex items-center justify-center p-4">
      <AuthThemeToggle />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-6">
            <BrandLogo adaptive variant="lockup" className="h-10" markClassName="h-10 w-10" wordmarkClassName="text-2xl" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-sm border border-blue-900/5 dark:border-blue-400/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input-enterprise pl-10 ${
                    errors.email 
                      ? 'border-red-300 dark:border-red-600' 
                      : ''
                  }`}
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input-enterprise pl-10 pr-10 ${
                    errors.password 
                      ? 'border-red-300 dark:border-red-600' 
                      : ''
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Remember me</span>
              </label>
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {errors.general && (
              <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                {showResendOption && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}
            {resendSuccess && (
              <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">Verification email sent. Check your inbox (and spam folder).</p>
              </div>
            )}

            {showCodeEntry && (
              <div>
                <label htmlFor="verification-code" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  Verification code
                </label>
                <input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="input-enterprise font-mono text-center text-lg tracking-widest"
                  placeholder="6-digit code from email"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter the 6-digit code from your verification email, then click Sign in.</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          {isGoogleAuthEnabled() && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <GoogleSignInButton
                  disabled={loading}
                  onSignedIn={(data) => onLogin({ ...formData, user: data.user })}
                  onError={(err) => {
                    console.error('Google sign-in:', err);
                    setErrors({ general: err?.message || 'Google sign-in failed.' });
                  }}
                />
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
