import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../features/auth/AuthContext';
import { AuthLayout } from '../../components/layout';
import { Input, Button, useToast } from '../../components/common';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// =============================================================================
// COMPONENT
// =============================================================================

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        showError('Sign in failed', error.message);
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      showError('Sign in failed', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your family tree"
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

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-[rgb(var(--color-input-border))] bg-[rgb(var(--color-bg-card))] text-[rgb(var(--color-accent-btn))] focus:ring-2 focus:ring-[rgb(var(--color-accent-btn))] checked:bg-[rgb(var(--color-accent-btn))] checked:border-[rgb(var(--color-accent-btn))]"
            />
            <span className="ml-2 text-sm text-[rgb(var(--color-text-muted))]">Remember me</span>
          </label>
          <Link to="/auth/forgot-password" className="link text-sm">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          size="lg"
        >
          Sign in
        </Button>

        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/auth/register" className="link">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
