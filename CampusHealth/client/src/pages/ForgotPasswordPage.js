import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      await authAPI.forgotPassword(data.email);
      toast.success('Password reset instructions sent if the account exists.');
      setIsSubmitted(true);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      toast.error(message);
      setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">
              Check Your Email
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              We've sent a password reset link and OTP to your email address. Please check your inbox and follow the instructions to reset your password.
            </p>
          </div>

          <div className="card text-center">
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Link
                to="/reset-password"
                className="btn-primary w-full inline-flex items-center justify-center"
              >
                I have my OTP
              </Link>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="btn-outline w-full"
                >
                  Try Again
                </button>
                
                <Link
                  to="/login"
                  className="btn-secondary w-full inline-flex items-center justify-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
                {errors.root.message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`form-input pl-10 ${errors.email ? 'border-danger-500' : ''}`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : null}
              Send Reset Link
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Remember your password?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 inline-flex items-center"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

