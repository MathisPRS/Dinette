import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { LogOut, User } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <AppLayout>
      <div className="px-4 lg:px-0 pt-safe pt-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">Profile</h1>

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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-left text-red-600 hover:bg-red-50 rounded-xl px-2 py-2 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
