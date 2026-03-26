import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { LogOut, User, Globe, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Fingerprint } from 'lucide-react';
import { useT, useI18nStore } from '@/i18n';
import type { Locale } from '@/i18n';
import { clsx } from 'clsx';
import { authApi } from '@/api/auth';
import { webAuthnApi, isBiometricAvailable } from '@/api/webauthn';
import { extractApiError } from '@/utils';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, webAuthnRegistered, setWebAuthnRegistered } = useAuthStore();
  const t = useT();
  const { locale, setLocale } = useI18nStore();

  // Change-password state
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState('');
  const [biometricSuccess, setBiometricSuccess] = useState('');

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (newPw !== confirmPw) {
      setPwError(t('validation_passwords_mismatch'));
      return;
    }
    if (newPw.length < 8) {
      setPwError(t('validation_password_min'));
      return;
    }
    if (!/[A-Z]/.test(newPw)) {
      setPwError(t('validation_password_uppercase'));
      return;
    }
    if (!/[0-9]/.test(newPw)) {
      setPwError(t('validation_password_number'));
      return;
    }

    setPwLoading(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => {
        setPwOpen(false);
        setPwSuccess(false);
      }, 2000);
    } catch (err) {
      setPwError(extractApiError(err));
    } finally {
      setPwLoading(false);
    }
  }

  function handleCancelPassword() {
    setPwOpen(false);
    setPwError('');
    setPwSuccess(false);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  }

  async function handleEnableBiometric() {
    setBiometricError('');
    setBiometricSuccess('');
    setBiometricLoading(true);
    try {
      await webAuthnApi.register();
      setWebAuthnRegistered(true);
      setBiometricSuccess(t('webauthn_register_success'));
    } catch (err) {
      setBiometricError(extractApiError(err) || t('webauthn_register_error'));
    } finally {
      setBiometricLoading(false);
    }
  }

  async function handleDisableBiometric() {
    setBiometricError('');
    setBiometricSuccess('');
    setBiometricLoading(true);
    try {
      await webAuthnApi.deleteCredential();
      setWebAuthnRegistered(false);
      setBiometricSuccess(t('webauthn_profile_disable_success'));
    } catch (err) {
      setBiometricError(extractApiError(err) || t('error_generic'));
    } finally {
      setBiometricLoading(false);
    }
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const languages: { value: Locale; label: string }[] = [
    { value: 'fr', label: t('profile_language_fr') },
    { value: 'en', label: t('profile_language_en') },
  ];

  return (
    <AppLayout>
      <div className="px-4 lg:px-0 pt-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">{t('profile_title')}</h1>

        {/* User info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
              <User size={24} className="text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Language selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3 mb-3 px-2">
            <Globe size={18} className="text-gray-500" />
            <span className="font-medium text-gray-700 text-sm">{t('profile_language')}</span>
          </div>
          <div className="flex gap-2">
            {languages.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLocale(value)}
                className={clsx(
                  'flex-1 py-2 rounded-xl text-sm font-medium border transition-colors',
                  locale === value
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
          <button
            onClick={() => { setPwOpen(!pwOpen); setPwError(''); setPwSuccess(false); }}
            className="flex items-center gap-3 w-full px-4 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <Lock size={18} className="text-gray-500 flex-shrink-0" />
            <span className="font-medium text-gray-700 text-sm flex-1">{t('profile_change_password')}</span>
            {pwOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {pwOpen && (
            <form onSubmit={handleChangePassword} className="px-4 pb-4 flex flex-col gap-3">
              {/* Current password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile_current_password')}
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile_new_password')}
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required
                    placeholder={t('register_password_placeholder')}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('profile_confirm_new_password')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {pwError && (
                <p className="text-xs text-red-500 px-1">{pwError}</p>
              )}
              {pwSuccess && (
                <p className="text-xs text-green-600 px-1">{t('profile_password_success')}</p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t('profile_password_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {pwLoading ? '...' : t('profile_save_password')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Biometric login */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Fingerprint size={20} className="text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm mb-1">{t('webauthn_profile_section')}</p>
              {!biometricAvailable ? (
                <p className="text-sm text-gray-500">{t('webauthn_not_available')}</p>
              ) : webAuthnRegistered ? (
                <>
                  <p className="text-sm text-gray-700">{t('webauthn_profile_enabled')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('webauthn_profile_enabled_desc')}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700">{t('webauthn_profile_disabled')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('webauthn_profile_disabled_desc')}</p>
                </>
              )}

              {biometricError && <p className="text-xs text-red-500 mt-3">{biometricError}</p>}
              {biometricSuccess && <p className="text-xs text-green-600 mt-3">{biometricSuccess}</p>}

              {biometricAvailable && (
                <button
                  onClick={webAuthnRegistered ? handleDisableBiometric : handleEnableBiometric}
                  disabled={biometricLoading}
                  className={clsx(
                    'mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    webAuthnRegistered
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-brand-600 text-white hover:bg-brand-700',
                    biometricLoading && 'opacity-50'
                  )}
                >
                  {biometricLoading
                    ? '...'
                    : webAuthnRegistered
                      ? t('webauthn_profile_disable')
                      : t('webauthn_profile_enable')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-left text-red-600 hover:bg-red-50 rounded-xl px-2 py-2 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">{t('profile_logout')}</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
