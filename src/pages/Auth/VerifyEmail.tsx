import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../../components/layout';
import { Button } from '../../components/common';

export function VerifyEmail() {
  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We've sent a verification link to your email address"
    >
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary-600" />
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Please check your email and click the verification link to complete your registration.
          </p>
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or try signing up again.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => window.location.href = '/auth/register'}
          >
            Try signing up again
          </Button>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
