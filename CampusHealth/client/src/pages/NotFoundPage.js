import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-neutral-600 mb-8">
            Sorry, we couldn't find the page you're looking for. 
            It might have been moved, deleted, or doesn't exist.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="btn-primary inline-flex items-center px-6 py-3 text-base font-medium"
          >
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Link>
          
          <div>
            <button
              onClick={() => window.history.back()}
              className="btn-outline inline-flex items-center px-6 py-3 text-base font-medium"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </button>
          </div>
        </div>

        <div className="mt-8 text-sm text-neutral-500">
          <p>
            If you believe this is an error, please{' '}
            <Link to="/contact" className="text-primary-600 hover:text-primary-500">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
