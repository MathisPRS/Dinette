import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authApi } from '@/api/auth';
import { webAuthnApi, isBiometricAvailable } from '@/api/webauthn';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { extractApiError } from '@/utils';
import { useT } from '@/i18n';
import { Fingerprint } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setWebAuthnRegistered = useAuthStore((s) => s.setWebAuthnRegistered);
  const webAuthnRegistered = useAuthStore((s) => s.webAuthnRegistered);

  const [apiError, setApiError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Post-login: propose to enable Face ID
  const [showEnablePrompt, setShowEnablePrompt] = useState(false);
  const [enableLoading, setEnableLoading] = useState(false);
  const [enableError, setEnableError] = useState('');
  // Keep auth data during the prompt so we can register before navigating
  const [pendingAuth, setPendingAuth] = useState<{
    token: string;
    refreshToken: string;
    user: Parameters<typeof setAuth>[2];
  } | null>(null);

  const t = useT();

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const schema = z.object({
    email: z.string().email(t('validation_email_invalid')),
    password: z.string().min(1, t('validation_password_required')),
  });
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setApiError('');
    try {
      const { token, refreshToken, user } = await authApi.login(data);
      setAuth(token, refreshToken, user);

      // Propose Face ID if: available on device & not yet registered
      if (biometricAvailable && !webAuthnRegistered) {
        setPendingAuth({ token, refreshToken, user });
        setShowEnablePrompt(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setApiError(extractApiError(err));
    }
  }

  async function handleEnableFaceId() {
    setEnableError('');
    setEnableLoading(true);
    try {
      await webAuthnApi.register();
      setWebAuthnRegistered(true);
      navigate('/');
    } catch {
      setEnableError(t('webauthn_register_error'));
      setEnableLoading(false);
    }
  }

  function handleSkipFaceId() {
    navigate('/');
  }

  async function handleBiometricLogin() {
    setApiError('');
    setBiometricLoading(true);
    try {
      const { token, refreshToken, user } = await webAuthnApi.authenticate();
      setAuth(token, refreshToken, user);
      navigate('/');
    } catch {
      setApiError(t('webauthn_login_error'));
    } finally {
      setBiometricLoading(false);
    }
  }

  // ── Post-login Face ID prompt ──────────────────────────────────────────────
  if (showEnablePrompt && pendingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <Fingerprint size={32} className="text-brand-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t('webauthn_register_title')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('webauthn_register_desc')}</p>

            {enableError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-4">
                {enableError}
              </p>
            )}

            <Button
              size="lg"
              loading={enableLoading}
              onClick={handleEnableFaceId}
              className="w-full mb-3"
            >
              <Fingerprint size={18} className="mr-2" />
              {t('webauthn_register_enable')}
            </Button>
            <button
              onClick={handleSkipFaceId}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
            >
              {t('webauthn_register_skip')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900">{t('app_name')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('login_subtitle')}</p>
        </div>

        {/* Face ID quick login */}
        {biometricAvailable && webAuthnRegistered && (
          <button
            onClick={handleBiometricLogin}
            disabled={biometricLoading}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium rounded-2xl py-3.5 mb-4 transition-colors"
          >
            <Fingerprint size={20} />
            {biometricLoading ? '…' : t('webauthn_login_button')}
          </button>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label={t('login_email')}
              type="email"
              autoComplete="email"
              placeholder={t('login_email_placeholder')}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label={t('login_password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {apiError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{apiError}</p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
              {t('login_submit')}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('login_no_account')}{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            {t('login_create_account')}
          </Link>
        </p>
      </div>
    </div>
  );
}

