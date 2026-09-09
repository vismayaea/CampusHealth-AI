import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  Lock,
  Mail,
  ShieldCheck,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { firebaseAuth, isFirebaseConfigured } from '../firebase';
import wellnessIllustration from '../assets/login-wellness.png';
import { demoAccounts, getDashboardPath } from '../utils/demoAccounts';

const googleErrorMessages = {
  'auth/popup-closed-by-user': 'Google sign-in was closed before completion.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups and try again.',
  'auth/network-request-failed': 'A network error interrupted Google sign-in. Check your connection and try again.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method.'
};

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showMockGoogleModal, setShowMockGoogleModal] = useState(false);
  const { login, googleLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue
  } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError('root', { message: result.error });
    }
  };

  const onGoogleLogin = async () => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setShowMockGoogleModal(true);
      return;
    }

    try {
      setIsGoogleLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(firebaseAuth, provider);
      const idToken = await credential.user.getIdToken();
      const rememberMe = Boolean(document.getElementById('remember-me')?.checked);
      const result = await googleLogin({ idToken, rememberMe });
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error(googleErrorMessages[error.code] || 'Google sign-in could not be completed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onDemoLogin = async (account) => {
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
    setValue('rememberMe', true);

    const result = await login({
      email: account.email,
      password: account.password,
      rememberMe: true
    });

    if (result.success) {
      navigate(getDashboardPath(result.user?.role), { replace: true });
    } else {
      setError('root', { message: result.error });
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-success-900 px-10 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-14">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-success-300/10 blur-3xl" aria-hidden="true" />

        <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-full focus:outline-none focus:ring-4 focus:ring-white/30">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 shadow-soft ring-1 ring-white/20 backdrop-blur">
            <Heart className="h-6 w-6 fill-white/10" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">CampusHealth AI</span>
        </Link>

        <div className="relative z-10 mx-auto mt-10 flex w-full max-w-2xl flex-1 flex-col justify-center xl:mt-12">
          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-primary-50 backdrop-blur">
              <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Private, compassionate campus support
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Wellbeing support, thoughtfully designed for student life.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-primary-100">
              Connect with counselors, complete guided assessments, and access AI-powered support in one secure space.
            </p>
          </div>

          <div className="relative mt-8 overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-2 shadow-strong backdrop-blur-sm xl:mt-10">
            <img
              src={wellnessIllustration}
              alt="A calm student surrounded by flowing natural forms at sunrise"
              className="h-72 w-full rounded-2xl object-cover object-center xl:h-80"
            />
            <div className="absolute inset-x-6 bottom-6 flex items-center gap-3 rounded-2xl border border-white/30 bg-primary-950/65 px-5 py-4 shadow-medium backdrop-blur-md">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-success-300" aria-hidden="true" />
              <p className="text-sm leading-6 text-white">
                A stigma-free platform built around privacy, early support, and meaningful connection.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary-100/70 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-success-100/60 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-medium">
              <Heart className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-neutral-900">CampusHealth AI</span>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-strong backdrop-blur-xl sm:p-9">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary-700">Secure sign in</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">Sign in with Gmail</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Continue quickly with Google, or use a demo Gmail account.
              </p>
            </div>

            {errors.root && (
              <div role="alert" className="mt-6 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                {errors.root.message}
              </div>
            )}

            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className="mt-7 flex min-h-14 w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3 text-base font-bold text-neutral-900 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <LoadingSpinner size="small" className="mr-3" />
              ) : (
                <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-base font-bold text-primary-700 shadow-sm ring-1 ring-neutral-200" aria-hidden="true">
                  G
                </span>
              )}
              {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50/70 p-3">
              <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-primary-900">
                <User className="h-4 w-4" aria-hidden="true" />
                Easy demo Gmail
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => onDemoLogin(account)}
                    disabled={isLoading || isGoogleLoading}
                    className="min-h-12 rounded-xl border border-primary-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="block text-sm font-bold text-neutral-900">{account.label}</span>
                    <span className="block truncate text-xs text-neutral-500">{account.email}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="my-7 flex items-center gap-4" aria-hidden="true">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">or use password</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-neutral-800">
                  Email address
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-neutral-400" aria-hidden="true">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`min-h-12 w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 ${
                      errors.email ? 'border-danger-400' : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                    placeholder="you@university.edu"
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-2 text-sm text-danger-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label htmlFor="password" className="block text-sm font-semibold text-neutral-800">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="rounded text-sm font-semibold text-primary-700 transition hover:text-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-100"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-neutral-400" aria-hidden="true">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={`min-h-12 w-full rounded-xl border bg-white py-3 pl-12 pr-12 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 ${
                      errors.password ? 'border-danger-400' : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-neutral-500 transition hover:text-neutral-800 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-primary-100"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-2 text-sm text-danger-600">{errors.password.message}</p>
                )}
              </div>

              <label htmlFor="remember-me" className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg text-sm text-neutral-700 focus-within:ring-4 focus-within:ring-primary-100">
                <input
                  {...register('rememberMe')}
                  id="remember-me"
                  type="checkbox"
                  className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                Keep me signed in on this device
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white shadow-medium transition hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? <LoadingSpinner size="small" className="mr-2" /> : null}
                Sign in
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />}
              </button>
            </form>

            <div className="hidden" aria-hidden="true">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">or continue with</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <button
              hidden
              type="button"
              onClick={onGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className="hidden"
            >
              {isGoogleLoading ? (
                <LoadingSpinner size="small" className="mr-3" />
              ) : (
                <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-primary-700 shadow-sm ring-1 ring-neutral-200" aria-hidden="true">
                  G
                </span>
              )}
              {isGoogleLoading ? 'Connecting to Google…' : 'Continue with Google'}
            </button>

            <p className="mt-8 text-center text-sm text-neutral-600">
              New to CampusHealth?{' '}
              <Link
                to="/register"
                className="rounded font-semibold text-primary-700 transition hover:text-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-100"
              >
                Create an account
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-neutral-500">
            Your privacy matters. CampusHealth uses secure, confidential access to protect your information.
          </p>
        </div>
      </section>

      {showMockGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold">G</span>
                <h3 className="text-lg font-bold text-neutral-900">Google Sign-In Simulator</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMockGoogleModal(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none"
              >
                ✕
              </button>
            </div>
            
            <p className="mt-4 text-sm text-neutral-600">
              Firebase is not configured in this local environment. Choose a demo account below to simulate a Google OAuth flow:
            </p>

            <div className="mt-4 space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={async () => {
                    setShowMockGoogleModal(false);
                    setIsGoogleLoading(true);
                    try {
                      const mockUser = {
                        email: account.email,
                        name: account.user.name,
                        picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${account.user.firstName}`,
                        uid: `google-mock-uid-${account.user.role}`
                      };
                      const tokenData = window.btoa(JSON.stringify(mockUser))
                        .replace(/=/g, '')
                        .replace(/\+/g, '-')
                        .replace(/\//g, '_');
                      const idToken = `test-firebase:${tokenData}`;
                      const rememberMe = Boolean(document.getElementById('remember-me')?.checked);
                      const result = await googleLogin({ idToken, rememberMe });
                      if (result.success) {
                        navigate(getDashboardPath(account.user.role), { replace: true });
                      }
                    } catch (err) {
                      toast.error('Mock Google login failed');
                    } finally {
                      setIsGoogleLoading(false);
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left transition hover:border-primary-300 hover:bg-primary-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 font-semibold text-neutral-700">
                    {account.user.firstName[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-neutral-900 truncate">{account.user.name}</span>
                    <span className="block text-xs text-neutral-500 truncate">{account.email} ({account.user.role})</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="my-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-semibold text-neutral-400 uppercase">Or Custom Email</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('customEmail')?.trim();
                const name = formData.get('customName')?.trim() || 'Custom User';
                if (!email) return;
                
                setShowMockGoogleModal(false);
                setIsGoogleLoading(true);
                try {
                  const mockUser = {
                    email,
                    name,
                    picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
                    uid: `google-mock-uid-custom-${Date.now()}`
                  };
                  const tokenData = window.btoa(JSON.stringify(mockUser))
                    .replace(/=/g, '')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_');
                  const idToken = `test-firebase:${tokenData}`;
                  const rememberMe = Boolean(document.getElementById('remember-me')?.checked);
                  const result = await googleLogin({ idToken, rememberMe });
                  if (result.success) {
                    navigate('/app/dashboard', { replace: true });
                  }
                } catch (err) {
                  toast.error('Mock Google login failed');
                } finally {
                  setIsGoogleLoading(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <input
                  name="customName"
                  type="text"
                  placeholder="Full Name"
                  required
                  className="min-h-10 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  name="customEmail"
                  type="email"
                  placeholder="custom.user@gmail.com"
                  required
                  className="min-h-10 flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-800"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default LoginPage;
