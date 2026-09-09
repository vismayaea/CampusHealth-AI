import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle, KeyRound, Lock } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm({
    defaultValues: {
      email: searchParams.get('email') || '',
      token: searchParams.get('token') || ''
    }
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authAPI.resetPassword(data);
      toast.success('Password reset successfully. Please sign in.');
      setIsComplete(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {isComplete && (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          )}
          <h2 className="text-3xl font-bold text-neutral-900">Reset Password</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Enter the email, reset token, OTP, and your new password.
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
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                  })}
                  type="email"
                  className={`form-input pl-10 ${errors.email ? 'border-danger-500' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-neutral-700 mb-2">Reset Token</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  {...register('token', { required: 'Reset token is required' })}
                  type="text"
                  className={`form-input pl-10 ${errors.token ? 'border-danger-500' : ''}`}
                  placeholder="Paste reset token"
                />
              </div>
              {errors.token && <p className="mt-1 text-sm text-danger-600">{errors.token.message}</p>}
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-neutral-700 mb-2">OTP</label>
              <input
                {...register('otp', {
                  required: 'OTP is required',
                  pattern: { value: /^\d{6}$/, message: 'OTP must be 6 digits' }
                })}
                type="text"
                maxLength="6"
                className={`form-input ${errors.otp ? 'border-danger-500' : ''}`}
                placeholder="6-digit OTP"
              />
              {errors.otp && <p className="mt-1 text-sm text-danger-600">{errors.otp.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/,
                      message: 'Use 8+ chars with uppercase, lowercase, number, and symbol'
                    }
                  })}
                  type="password"
                  className={`form-input pl-10 ${errors.password ? 'border-danger-500' : ''}`}
                  placeholder="New password"
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">Confirm Password</label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match'
                })}
                type="password"
                className={`form-input ${errors.confirmPassword ? 'border-danger-500' : ''}`}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <LoadingSpinner size="small" className="mr-2" /> : null}
              Reset Password
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500 inline-flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
