import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { AuthLayout } from '../../components/layout';
import { Input, Button, useToast } from '../../components/common';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// =============================================================================
// COMPONENT
// =============================================================================

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      if (error) {
        showError('Failed to send reset email', error.message);
      } else {
        setIsEmailSent(true);
        success('Email sent!', 'Check your inbox for password reset instructions.');
      }
    } catch (err) {
      showError('Failed to send reset email', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a password reset link to ${getValues('email')}`}
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600">
            Click the link in your email to reset your password. If you don't see the email,
            check your spam folder.
          </p>
          <div className="space-y-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsEmailSent(false)}
            >
              Didn't receive the email? Try again
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

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          size="lg"
        >
          Send reset link
        </Button>

        <div className="text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
