import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../features/auth/AuthContext';
import { AuthLayout } from '../../components/layout';
import { Input, Button, useToast } from '../../components/common';

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// =============================================================================
// COMPONENT
// =============================================================================

export function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await updatePassword(data.password);
      if (error) {
        showError('Failed to reset password', error.message);
      } else {
        success('Password updated!', 'You can now sign in with your new password.');
        navigate('/auth/login');
      }
    } catch (err) {
      showError('Failed to reset password', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Enter your new password below"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter new password"
          error={errors.password?.message}
          hint="At least 8 characters with uppercase, lowercase, and a number"
          {...register('password')}
        />

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          size="lg"
        >
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
