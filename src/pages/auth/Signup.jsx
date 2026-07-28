import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Building,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import AuthThemeToggle from '../../components/auth/AuthThemeToggle';
import BrandLogo from '../../components/brand/BrandLogo';
import { isGoogleAuthEnabled } from '../../utils/googleAuth';
import { api } from '../../services/api';

/**
 * Signup page with enterprise design
 */
const Signup = ({ onSignup, onNavigateToLogin, onGoogleSignedIn }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

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
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        username: formData.email.split('@')[0],
        first_name: formData.firstName,
        last_name: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        company: formData.company,
        department: formData.company,
      };
      
      await api.auth.register(userData);
      setSuccess(true);
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: error.message || 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const strengthMap = {
      0: { label: 'Very Weak', color: 'text-red-600' },
      1: { label: 'Weak', color: 'text-red-600' },
      2: { label: 'Fair', color: 'text-amber-600' },
      3: { label: 'Good', color: 'text-blue-600' },
      4: { label: 'Strong', color: 'text-green-600' },
      5: { label: 'Very Strong', color: 'text-green-600' }
    };
    
    return { score, ...strengthMap[score] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (success) {
    return (
      <div className="min-h-screen brand-auth-shell flex items-center justify-center p-4">
        <AuthThemeToggle />
        <div className="w-full max-w-md">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-sm border border-blue-900/5 dark:border-blue-400/10 p-8 text-center">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Check your email
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Registration successful! We've sent a 6-digit verification code to <strong className="text-gray-900 dark:text-white">{formData.email}</strong>. Check your email and enter the code at the verify page, or click the link in the email.
            </p>
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
              <p className="text-xs text-primary-800 dark:text-primary-200">
                <strong>Note:</strong> The verification link will expire in 10 minutes. If you don't see the email, check your spam folder.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/verify?email=' + encodeURIComponent(formData.email))}
                variant="outline"
                className="flex-1"
              >
                Enter verification code
              </Button>
              <Button
                onClick={onNavigateToLogin}
                variant="primary"
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen brand-auth-shell flex items-center justify-center p-4">
      <AuthThemeToggle />
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-6">
            <BrandLogo adaptive variant="lockup" className="h-10" markClassName="h-10 w-10" wordmarkClassName="text-2xl" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Create your account</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Get started with enterprise IT support</p>
        </div>

        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-sm border border-blue-900/5 dark:border-blue-400/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`input-enterprise pl-10 ${errors.firstName ? 'border-red-300 dark:border-red-600' : ''}`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`input-enterprise pl-10 ${errors.lastName ? 'border-red-300 dark:border-red-600' : ''}`}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.lastName}</p>}
              </div>
            </div>

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
                  className={`input-enterprise pl-10 ${errors.email ? 'border-red-300 dark:border-red-600' : ''}`}
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="company" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                Company
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleInputChange}
                  className={`input-enterprise pl-10 ${errors.company ? 'border-red-300 dark:border-red-600' : ''}`}
                  placeholder="Acme Inc."
                />
              </div>
              {errors.company && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.company}</p>}
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
                  className={`input-enterprise pl-10 pr-10 ${errors.password ? 'border-red-300 dark:border-red-600' : ''}`}
                  placeholder="Create a strong password"
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
              {formData.password && (
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 w-6 rounded-full ${
                          level <= passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? 'bg-red-600'
                              : passwordStrength.score <= 3
                              ? 'bg-amber-600'
                              : 'bg-green-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {errors.password && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`input-enterprise pl-10 pr-10 ${errors.confirmPassword ? 'border-red-300 dark:border-red-600' : ''}`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700 rounded mt-0.5"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <a href="https://resolvemeq.net/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="https://resolvemeq.net/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.agreeToTerms && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.agreeToTerms}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
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
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Create account
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
                  onSignedIn={(data) => onGoogleSignedIn?.({ user: data.user })}
                  onError={(err) => setErrors({ general: err?.message || 'Google sign-in failed.' })}
                />
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
