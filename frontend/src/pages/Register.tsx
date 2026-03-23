import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { extractApiError } from '@/utils';
import { useT } from '@/i18n';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [apiError, setApiError] = useState('');
  const t = useT();

  const schema = z.object({
    name: z.string().min(1, t('validation_name_required')).max(100),
    email: z.string().email(t('validation_email_invalid')),
    password: z
      .string()
      .min(8, t('validation_password_min'))
      .regex(/[A-Z]/, t('validation_password_uppercase'))
      .regex(/[0-9]/, t('validation_password_number')),
    confirmPassword: z.string(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: t('validation_passwords_mismatch'),
    path: ['confirmPassword'],
  });
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit({ name, email, password }: FormData) {
    setApiError('');
    try {
      const { token, refreshToken, user } = await authApi.register({ name, email, password });
      setAuth(token, refreshToken, user);
      navigate('/');
    } catch (err) {
      setApiError(extractApiError(err));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900">{t('app_name')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('register_subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label={t('register_name')}
              type="text"
              autoComplete="name"
              placeholder={t('register_name_placeholder')}
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label={t('register_email')}
              type="email"
              autoComplete="email"
              placeholder={t('register_email_placeholder')}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label={t('register_password')}
              type="password"
              autoComplete="new-password"
              placeholder={t('register_password_placeholder')}
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label={t('register_confirm_password')}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {apiError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{apiError}</p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
              {t('register_submit')}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('register_has_account')}{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            {t('register_login_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
