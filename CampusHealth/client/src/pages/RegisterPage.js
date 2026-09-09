import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye, EyeOff, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const { languages } = useLanguage();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm({
    defaultValues: {
      role: 'student'
    }
  });

  const password = watch('password');
  const role = watch('role', 'student');

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }

    const result = await registerUser(data);
    if (result.success) {
      navigate('/app/dashboard');
    } else {
      setError('root', { message: result.error });
    }
  };

  const yearOfStudyOptions = [
    '1st Year',
    '2nd Year', 
    '3rd Year',
    '4th Year',
    'Post Graduate',
    'PhD'
  ];

  const departmentOptions = [
    'Computer Science',
    'Engineering',
    'Psychology',
    'Medicine',
    'Business Administration',
    'Arts',
    'Science',
    'Commerce',
    'Law',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <aside className="premium-shell sticky top-8 hidden p-8 lg:block">
          <Link to="/" className="inline-flex items-center gap-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-medium">
              <Heart className="h-6 w-6" />
            </span>
            <span className="text-lg font-bold text-neutral-900">CampusHealth AI</span>
          </Link>
          <div className="mt-12">
            <span className="premium-kicker">
              <Sparkles className="mr-2 h-4 w-4" /> Student wellbeing access
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight text-neutral-900">Create a calmer support space in minutes.</h1>
            <p className="mt-4 text-neutral-600">
              Join the secure campus platform for AI support, counselor booking, assessments, resources, and community care.
            </p>
          </div>
          <div className="mt-8 space-y-4">
            {['Private student account', 'Guided assessments', 'Counselor and event access'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-primary-50 p-4 text-sm font-semibold text-neutral-800">
                <ShieldCheck className="h-5 w-5 text-primary-700" /> {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="w-full space-y-6">
          <div className="text-center lg:hidden">
            <Link to="/" className="mb-5 inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-700 text-white">
                <Heart className="h-6 w-6" />
              </span>
              <span className="text-lg font-bold text-neutral-900">CampusHealth AI</span>
            </Link>
            <h2 className="text-3xl font-black text-neutral-900">Create Your Account</h2>
            <p className="mt-2 text-sm text-neutral-600">Join your campus mental health support workspace</p>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="mb-8 hidden lg:block">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary-700">Secure onboarding</p>
              <h2 className="mt-3 text-3xl font-black text-neutral-900">Create your student account</h2>
              <p className="mt-2 text-neutral-600">Tell us the basics so we can personalize your wellbeing space.</p>
            </div>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
                {errors.root.message}
              </div>
            )}

            <input type="hidden" {...register('role')} value="student" />

            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
              <p className="text-sm font-semibold text-primary-800">Account type: Student</p>
              <p className="mt-1 text-sm text-primary-700">
                Counselor and administrator accounts are created by authorized administrators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ID (Student or Counselor) */}
            <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-neutral-700 mb-2">
                  {role === 'counselor' ? 'Counselor ID *' : 'Student ID *'}
                </label>
                <input
                  {...register('studentId', {
                    required: role === 'counselor' ? 'Counselor ID is required' : 'Student ID is required',
                    pattern: {
                      value: /^[A-Z0-9]+$/,
                      message: `${role === 'counselor' ? 'Counselor' : 'Student'} ID should contain only uppercase letters and numbers`
                    }
                  })}
                  type="text"
                  className={`form-input ${errors.studentId ? 'border-danger-500' : ''}`}
                  placeholder={role === 'counselor' ? 'e.g., CNS001' : 'e.g., STU001'}
                />
                {errors.studentId && (
                  <p className="mt-1 text-sm text-danger-600">{errors.studentId.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address *
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`form-input ${errors.email ? 'border-danger-500' : ''}`}
                  placeholder="your.email@university.edu"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                  First Name *
                </label>
                <input
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className={`form-input ${errors.firstName ? 'border-danger-500' : ''}`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-danger-600">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                  Last Name *
                </label>
                <input
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className={`form-input ${errors.lastName ? 'border-danger-500' : ''}`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-danger-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone Number
                </label>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^\+?[1-9][\d]{0,15}$/,
                      message: 'Invalid phone number'
                    }
                  })}
                  type="tel"
                  className={`form-input ${errors.phone ? 'border-danger-500' : ''}`}
                  placeholder="+91-9876543210"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-danger-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-neutral-700 mb-2">
                  Date of Birth
                </label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className={`form-input ${errors.dateOfBirth ? 'border-danger-500' : ''}`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-danger-600">{errors.dateOfBirth.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-2">
                  Department *
                </label>
                <select
                  {...register('department', { required: 'Department is required' })}
                  className={`form-select ${errors.department ? 'border-danger-500' : ''}`}
                >
                  <option value="">Select your department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-danger-600">{errors.department.message}</p>
                )}
              </div>

              {/* Year of Study (students only) */}
              <div>
                <label htmlFor="yearOfStudy" className="block text-sm font-medium text-neutral-700 mb-2">
                  Year of Study {role === 'student' ? '*' : '(students only)'}
                </label>
                <select
                  {...register('yearOfStudy', {
                    validate: (value) => {
                      if (role === 'student' && !value) {
                        return 'Year of study is required for students';
                      }
                      return true;
                    }
                  })}
                  className={`form-select ${errors.yearOfStudy ? 'border-danger-500' : ''}`}
                  disabled={role !== 'student'}
                >
                  <option value="">Select your year</option>
                  {yearOfStudyOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.yearOfStudy && (
                  <p className="mt-1 text-sm text-danger-600">{errors.yearOfStudy.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-neutral-700 mb-2">
                  Gender
                </label>
                  <select
                    {...register('gender')}
                    className="form-select"
                  >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Preferred Language */}
              <div>
                <label htmlFor="preferredLanguage" className="block text-sm font-medium text-neutral-700 mb-2">
                  Preferred Language *
                </label>
                <select
                  {...register('preferredLanguage', { required: 'Preferred language is required' })}
                  className={`form-select ${errors.preferredLanguage ? 'border-danger-500' : ''}`}
                >
                  <option value="">Select language</option>
                  {Object.values(languages).map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                {errors.preferredLanguage && (
                  <p className="mt-1 text-sm text-danger-600">{errors.preferredLanguage.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                      value: 6,
                        message: 'Password must be at least 6 characters'
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/,
                        message: 'Use 8+ chars with uppercase, lowercase, number, and symbol'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input pr-10 ${errors.password ? 'border-danger-500' : ''}`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input pr-10 ${errors.confirmPassword ? 'border-danger-500' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-start rounded-2xl bg-neutral-50 p-4">
              <input
                {...register('terms', { required: 'You must accept the terms' })}
                id="terms"
                type="checkbox"
                className="form-checkbox"
              />
              <label htmlFor="terms" className="ml-3 block text-sm text-neutral-700">
                I agree to follow the campus wellbeing platform terms and privacy expectations shared by my institution.
              </label>
            </div>
            {errors.terms && (
              <p className="-mt-4 text-sm text-danger-600">{errors.terms.message}</p>
            )}

            <div className="flex items-center rounded-2xl bg-neutral-50 p-4">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                className="form-checkbox"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-neutral-700">
                Keep me logged in on this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : null}
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
